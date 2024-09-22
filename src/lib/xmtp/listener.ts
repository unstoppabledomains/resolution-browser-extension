import {Client, DecodedMessage, StaticKeystoreProvider} from "@xmtp/xmtp-js";
import {Logger} from "../logger";
import {Mutex} from "async-mutex";
import {fetcher} from "@xmtp/proto";
import {ContentTypeText} from "@xmtp/xmtp-js";
import config from "@unstoppabledomains/config";
import * as extConfig from "../../config";

import {
  StorageSyncKey,
  chromeStorageGet,
  chromeStorageSet,
} from "../chromeStorage";
import {incrementBadgeCount} from "../runtime";
import {getReverseResolution} from "../resolver/resolver";
import {getWalletPreferences} from "../wallet/preferences";
import {XMTP_CONVERSATION_FLAG} from "../../types/wallet/messages";

let xmtpClient: Client = null;
const xmtpMutex = new Mutex();

export const listenForXmtpMessages = async (xmtpKey?: string) => {
  // ensure xmtpClient singleton instance
  await xmtpMutex.runExclusive(async () => {
    // no work to do if client already initialized
    if (xmtpClient) {
      Logger.log("XMTP listener already initialized");
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
  });
};

const waitForMessages = async () => {
  // cannot listen without client
  if (!xmtpClient) {
    return;
  }

  // refresh the local consent list
  const consentList = await xmtpClient.contacts.refreshConsentList();

  // listen for notification clicks
  chrome.notifications.onClicked.addListener(handleMessageClick);

  // listen for XMTP messages
  Logger.log(
    "Waiting for XMTP messages...",
    JSON.stringify({address: xmtpClient.address, consentList}),
  );
  for await (const message of await xmtpClient.conversations.streamAllMessages()) {
    // ensure the user is still signed in
    const xmtpKey = await chromeStorageGet(StorageSyncKey.XmtpKey, "local");
    if (!xmtpKey) {
      Logger.warn("Listener exiting, XMTP key not found");
      xmtpClient = null;
      return;
    }

    // ensure the user still desires notifications
    const preferences = await getWalletPreferences();
    if (!preferences.MessagingEnabled) {
      Logger.warn("Listener existing, messaging is disabled");
      xmtpClient = null;
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
  if (chrome.notifications) {
    chrome.notifications.create(
      `xmtp-${decodedMessage.senderAddress.toLowerCase()}-${decodedMessage.id}`,
      {
        type: "basic",
        title: senderName || decodedMessage.senderAddress,
        iconUrl: chrome.runtime.getURL("/icon/128.png"),
        message: decodedMessage.contentType.sameAs(ContentTypeText)
          ? decodedMessage.content
          : "Attachment",
        isClickable: true,
        contextMessage: isApproved ? "Approved contact" : undefined,
        priority: isApproved ? 2 : 0,
      },
    );
  }
};

const handleMessageClick = async (notificationId: string) => {
  // clear the notification
  chrome.notifications.clear(notificationId);

  // get the chat ID from notification ID
  const idParts = notificationId.split("-");
  const xmtpChatId = idParts.length > 0 ? idParts[1] : undefined;
  if (!xmtpChatId) {
    return;
  }

  // get the currently active window (if any)
  const activeTab = await chrome.tabs.getCurrent();

  // get the default popup URL
  const defaultPopupUrl = await chrome.action.getPopup({tabId: activeTab?.id});

  // open the popup with the current conversation in focus
  await chrome.action.setPopup({
    popup: `${defaultPopupUrl}?${XMTP_CONVERSATION_FLAG}=${xmtpChatId}`,
  });
  await chrome.action.openPopup({windowId: activeTab?.windowId});

  // reset the popup URL to default
  await chrome.action.setPopup({
    popup: defaultPopupUrl,
  });
};
