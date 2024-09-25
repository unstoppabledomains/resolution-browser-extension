import {Client, DecodedMessage, StaticKeystoreProvider} from "@xmtp/xmtp-js";
import {Logger} from "../logger";
import {Mutex} from "async-mutex";
import {fetcher} from "@xmtp/proto";
import {ContentTypeText} from "@xmtp/xmtp-js";
import config from "@unstoppabledomains/config";

import {
  StorageSyncKey,
  chromeStorageGet,
  chromeStorageSet,
} from "../chromeStorage";
import {createNotification, incrementBadgeCount} from "../runtime";
import {getReverseResolution} from "../resolver/resolver";
import {getWalletPreferences} from "../wallet/preferences";
import {XMTP_CONVERSATION_FLAG} from "../../types/wallet/messages";

let xmtpClient: Client = null;
const xmtpMutex = new Mutex();

export const waitForXmtpMessages = async (xmtpKey?: string) => {
  // ensure xmtpClient singleton instance
  await xmtpMutex.runExclusive(async () => {
    // no work to do if client already initialized
    if (xmtpClient) {
      return;
    }

    // listen for notification clicks
    if (!chrome.notifications.onClicked.hasListeners()) {
      Logger.log("Listening for notification clicks...");
      chrome.notifications.onClicked.addListener(handleNotificationClick);
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

    // check every so often for messaging enablement
    const interval = setInterval(async () => {
      const isEnabled = await assertMessagingEnabled();
      if (!isEnabled) {
        clearInterval(interval);
      }
    }, 5000);
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
    "Unstoppable Messaging",
    "You're signed in! Connect with friends using Unstoppable Messaging, powered by XMTP. Over 2 million onchain identities use XMTP for secure, private, and portable messaging.",
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
  await xmtpClient.contacts.loadConsentList();

  // determine if sender has been accepted
  const isApproved = xmtpClient.contacts.isAllowed(
    decodedMessage.senderAddress,
  );
  Logger.log("Got XMTP message", {
    from: decodedMessage.senderAddress,
    isApproved,
  });

  // update badge count to indicate new message
  await incrementBadgeCount("blue");

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
  const senderName = await getReverseResolution(decodedMessage.senderAddress);

  // notify the user of the message if permission available
  await createNotification(
    `xmtp-${decodedMessage.senderAddress.toLowerCase()}-${decodedMessage.id}`,
    senderName || decodedMessage.senderAddress,
    decodedMessage.contentType.sameAs(ContentTypeText)
      ? decodedMessage.content
      : "Attachment",
    isApproved ? "Approved contact" : undefined,
    isApproved ? 2 : 0,
  );
};

const handleNotificationClick = async (notificationId: string) => {
  // clear the notification
  chrome.notifications.clear(notificationId);

  try {
    // get the chat ID from notification ID
    const idParts = notificationId.split("-");
    const xmtpChatId = idParts.length > 0 ? idParts[1] : undefined;

    // get the default popup URL
    const activeTab = await chrome.tabs.getCurrent();
    const defaultPopupUrl = await chrome.action.getPopup({
      tabId: activeTab?.id,
    });
    if (!defaultPopupUrl) {
      throw new Error("unable to find active tab ID");
    }

    // if a conversation ID is specified, set the popup focus
    if (xmtpChatId) {
      await chrome.action.setPopup({
        popup: `${defaultPopupUrl}?${XMTP_CONVERSATION_FLAG}=${xmtpChatId}`,
      });
    }

    // open the popup
    await chrome.action.openPopup({windowId: activeTab?.windowId});

    // reset the popup URL to default
    await chrome.action.setPopup({
      popup: defaultPopupUrl,
    });
  } catch (e) {
    Logger.warn("Error handling notification click", e);
  }
};
