import {ContentTypeText} from "@xmtp/content-type-text";
import {fetcher} from "@xmtp/proto";
import {Client, DecodedMessage, StaticKeystoreProvider} from "@xmtp/xmtp-js";
import {Mutex} from "async-mutex";
import truncateMiddle from "truncate-middle";

import config from "@unstoppabledomains/config";

import extensionConfig from "../../config";
import {currentFocussedWindowId} from "../../scripts/liteWalletProvider/background";
import {
  StorageSyncKey,
  chromeStorageGet,
  chromeStorageSet,
} from "../chromeStorage";
import {Logger} from "../logger";
import {getResolution} from "../resolver/resolver";
import {
  BadgeColor,
  createNotification,
  incrementBadgeCount,
  openSidePanel,
  setBadgeCount,
} from "../runtime";
import {getWalletPreferences} from "../wallet/preferences";

let xmtpClient: Client | null = null;
const xmtpMutex = new Mutex();

export const waitForXmtpMessages = async (xmtpKey?: string) => {
  // check XMTP preferences
  const preferences = await getWalletPreferences();
  if (!preferences.MessagingEnabled) {
    return;
  }

  // ensure xmtpClient singleton instance
  await xmtpMutex.runExclusive(async () => {
    // no work to do if client already initialized
    if (xmtpClient) {
      Logger.log("Already listening for XMTP messages");
      return;
    }

    // determine if notification permission is available
    if (chrome.notifications) {
      // listen for notification clicks
      if (!chrome.notifications.onClicked.hasListeners()) {
        Logger.log("Listening for notification clicks...");
        chrome.notifications.onClicked.addListener(handleNotificationClick);
      }
    } else {
      // register for permission updates and try again when available
      Logger.log("Waiting for notifications permission to be available...");
      chrome.permissions.onAdded.addListener(async p => {
        if (p?.permissions?.includes("notifications")) {
          await waitForXmtpMessages(xmtpKey);
        }
      });
      return;
    }

    // validate the provided XMTP key
    if (!xmtpKey) {
      // attempt to retrieve from secure local storage
      xmtpKey = await chromeStorageGet(StorageSyncKey.XmtpKey, "local");

      // cannot continue without key
      if (!xmtpKey) {
        Logger.log("XMTP key not available");
        return;
      }
    }

    // decode the key and create client
    Logger.log("Initializing XMTP listener");
    const xmtpKeyDecoded = fetcher.b64Decode(xmtpKey);
    xmtpClient = await Client.create(null, {
      persistConversations: false,
      privateKeyOverride: xmtpKeyDecoded,
      keystoreProviders: [new StaticKeystoreProvider()],
      env: config.XMTP.ENVIRONMENT,
    });

    // store the XMTP key in secure local storage for future use
    await chromeStorageSet(StorageSyncKey.XmtpKey, xmtpKey, "local");

    // wait for messages
    void waitForMessages();

    // periodically check sign in status
    const xmtpAlarmName = "xmtpStatus";
    await chrome.alarms.create(xmtpAlarmName, {
      delayInMinutes: 1,
      periodInMinutes: 1,
    });
    chrome.alarms.onAlarm.addListener(async (alarm: chrome.alarms.Alarm) => {
      if (alarm.name === xmtpAlarmName) {
        const isEnabled = await assertMessagingEnabled();
        if (!isEnabled) {
          await chrome.alarms.clear(xmtpAlarmName);
        }
      }
    });
  });
};

const waitForMessages = async () => {
  // cannot listen without client
  if (!xmtpClient) {
    return;
  }

  // refresh the local consent list
  const consentList = await xmtpClient.contacts.refreshConsentList();

  // notify the user of their signed in status
  await createNotification(
    "xmtp-chat-initialized",
    extensionConfig.extension.name,
    "Your inbox is ready to use, powered by XMTP. Click to chat with friends.",
    undefined,
    2,
  );

  // listen for XMTP messages
  Logger.log(
    "Waiting for XMTP messages...",
    JSON.stringify({address: xmtpClient.address, consentList}),
  );
  for await (const message of await xmtpClient.conversations.streamAllMessages()) {
    // ensure the user is still signed in
    const isEnabled = await assertMessagingEnabled();
    if (!isEnabled) {
      return;
    }

    // handle the message
    if (
      message.senderAddress.toLowerCase() !== xmtpClient.address.toLowerCase()
    ) {
      try {
        await handleMessage(message);
      } catch (e) {
        Logger.warn("Error processing incoming XMTP message", e);
      }
    }
  }
};

const assertMessagingEnabled = async () => {
  // ensure the user is still signed in
  const xmtpKey = await chromeStorageGet(StorageSyncKey.XmtpKey, "local");
  if (!xmtpKey) {
    Logger.warn("Listener exiting, XMTP key not found");
    xmtpClient = null;
    return false;
  }

  // ensure the user still desires notifications
  const preferences = await getWalletPreferences();
  if (!preferences.MessagingEnabled) {
    Logger.warn("Listener existing, messaging is disabled");
    xmtpClient = null;
    return false;
  }

  // still signed in
  return true;
};

const handleMessage = async (decodedMessage: DecodedMessage) => {
  // refresh the local consent list
  await xmtpClient?.contacts.loadConsentList();

  // determine if sender has been accepted
  const isApproved = xmtpClient?.contacts.isAllowed(
    decodedMessage.senderAddress,
  );
  Logger.log("Got XMTP message", {
    from: decodedMessage.senderAddress,
    isApproved,
  });

  // update badge count to indicate new message
  await incrementBadgeCount(BadgeColor.Blue);

  // no work required if popup is already active
  const activePopups = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.POPUP],
  });
  if (activePopups.length > 0) {
    Logger.warn(
      "Dropping XMTP notification, extension is open",
      decodedMessage.senderAddress,
    );
    return;
  }

  // attempt to resolve a name for the address
  const senderName = await getResolution(decodedMessage.senderAddress);

  // for unapproved contacts, only show the notification one time
  if (!isApproved) {
    // check to see whether this contact was already shown
    const xmtpSpam =
      (await chromeStorageGet<string[]>(
        StorageSyncKey.XmtpNotifications,
        "session",
      )) || [];
    if (xmtpSpam.includes(decodedMessage.senderAddress.toLowerCase())) {
      Logger.warn(
        "Dropping XMTP notification, already displayed for unknown contact",
        {address: decodedMessage.senderAddress},
      );
      return;
    }

    // remember that we notified for this contact
    xmtpSpam.push(decodedMessage.senderAddress.toLowerCase());
    await chromeStorageSet(
      StorageSyncKey.XmtpNotifications,
      xmtpSpam,
      "session",
    );
  }

  // notify the user of the message if permission available
  await createNotification(
    `xmtp-${decodedMessage.senderAddress.toLowerCase()}-${decodedMessage.id}`,
    senderName?.domain ||
      `Wallet ${truncateMiddle(decodedMessage.senderAddress, 6, 4, "...")}`,
    isApproved
      ? decodedMessage.contentType.sameAs(ContentTypeText)
        ? decodedMessage.content
        : "Attachment"
      : "You have a new message request",
    isApproved ? "Approved contact" : "Possible spam",
    isApproved ? 2 : 0,
  );
};

const handleNotificationClick = async (notificationId: string) => {
  // clear the notification
  chrome.notifications.clear(notificationId);

  // retrieve the default popup URL
  const defaultPopupUrl = chrome.runtime.getURL("/index.html");

  try {
    // get the chat ID from notification ID
    const idParts = notificationId.split("-");
    const xmtpChatId = idParts.length > 0 ? idParts[1] : undefined;

    // if a conversation ID is specified, open the conversation
    // in the side panel
    if (xmtpChatId) {
      await openSidePanel({
        address: xmtpChatId,
        windowId: currentFocussedWindowId,
      });
      await setBadgeCount(0, BadgeColor.Blue);
      return;
    }

    // get the default popup URL
    const activeTab = await chrome.tabs.getCurrent();

    // open the popup
    await chrome.action.openPopup({windowId: activeTab?.windowId});
  } catch (e) {
    Logger.warn("Error handling notification click", e);
  } finally {
    // reset the popup URL to default
    await chrome.action.setPopup({
      popup: defaultPopupUrl,
    });
  }
};
