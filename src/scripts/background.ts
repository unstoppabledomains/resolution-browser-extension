import "../subscripts/onInstalled";
import {
  ProviderEvent,
  ProviderRequest,
  isExternalRequestType,
  isResponseType,
} from "../types/wallet";
import {supportedDomains} from "../util/helpers";

/************************************
 * Onchain domain IPFS redirect logic
 ************************************/

const RESOLUTION_URL = "https://api.unstoppabledomains.com/resolve/";
const REDIRECT_URL = `${RESOLUTION_URL}redirect?url=`;
const domainsList = supportedDomains.map((domain) => domain.replace(".", ""));

function deleteAllRules() {
  chrome.declarativeNetRequest.getDynamicRules((rules) => {
    const ruleIds = rules.map((rule) => rule.id);

    if (ruleIds.length > 0) {
      chrome.declarativeNetRequest.updateDynamicRules(
        {removeRuleIds: ruleIds},
        () => {
          console.log("All dynamic rules have been removed successfully.");
        },
      );
    } else {
      console.log("No dynamic rules to remove.");
    }
  });
}

function addRules() {
  console.log("Adding HTTP rules...");
  domainsList.forEach((domain, index) => {
    const urlRegex = `https?://([^/]*?\\.${domain})(/|$)`;
    const id = index + 1001;
    chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [
        {
          id,
          action: {
            type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
            redirect: {
              regexSubstitution: `${REDIRECT_URL}\\1`,
            },
          },
          condition: {
            regexFilter: urlRegex,
            resourceTypes: [
              "main_frame" as chrome.declarativeNetRequest.ResourceType,
            ],
          },
        },
      ],
      removeRuleIds: [id],
    });
  });

  console.log("Adding search engines rules...");
  domainsList.forEach((domain, index) => {
    const urlRegex = `https?://.*[?&]q=([^&]*?\\b\\.${domain})(&|$)`;
    const id = index + 2001;
    chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [
        {
          id,
          action: {
            type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
            redirect: {
              regexSubstitution: `${REDIRECT_URL}\\1`,
            },
          },
          condition: {
            regexFilter: urlRegex,
            resourceTypes: [
              "main_frame" as chrome.declarativeNetRequest.ResourceType,
            ],
            requestDomains: [
              "google.com",
              "duckduckgo.com",
              "bing.com",
              "mojeek.com",
              "qwant.com",
              "search.aol.co.uk",
              "yahoo.com",
              "wiki.com",
            ],
          },
        },
      ],
      removeRuleIds: [id],
    });
  });
}

deleteAllRules();

setTimeout(() => {
  addRules();
}, 2000);

/***********************************
 * Wallet extension popup management
 ***********************************/

// listen for requests to open the wallet extension popup
let extensionPopupWindowId = null;
chrome.runtime.onMessage.addListener(
  (
    request: ProviderRequest,
    _sender: chrome.runtime.MessageSender,
    popupResponseHandler: (response: ProviderEvent) => void,
  ) => {
    // only handle the popup for supported external requests types
    if (isExternalRequestType(request.type)) {
      // find the active tab that requested the wallet extension popup
      chrome.tabs
        .query({
          active: true,
          lastFocusedWindow: true,
        })
        .then((activeTabs) => {
          // generate a URL with encoded state to open a wallet extension popup. The pieces encoded state
          // includes information about the tab requesting the popup, and the wallet provider request
          // parameters that should be handled by the popup.
          const requestSource = activeTabs[0];
          const requestUrl = chrome.runtime.getURL(
            `index.html?request=${encodeURIComponent(JSON.stringify(request))}&source=${encodeURIComponent(JSON.stringify(requestSource))}#connect`,
          );

          // if a widow ID is already generated, use it
          if (extensionPopupWindowId) {
            // if a popup window is already open, use it
            chrome.tabs.query(
              {windowId: extensionPopupWindowId},
              (extensionPopupWindow) => {
                if (extensionPopupWindow.length === 0) {
                  // the previous window ID has been closed, so a new extension popup
                  // needs to be opened
                  extensionPopupWindowId = null;
                  openPopupWindow(popupResponseHandler, requestUrl);
                } else {
                  // listen for a response on the existing wallet extension popup
                  listenForPopupResponse(popupResponseHandler);
                }
              },
            );
          } else {
            // open a new wallet extension popup
            openPopupWindow(popupResponseHandler, requestUrl);
          }
        });

      // successfully handled request to open wallet extension popup
      return true;
    }
  },
);

// openPopupWindow creates a new wallet extension popup window
const openPopupWindow = (
  popupResponseHandler: (response: ProviderEvent) => void,
  popupUrl: string,
) => {
  // open a new wallet extension popup
  chrome.windows.create(
    {
      url: popupUrl,
      type: "popup",
      width: 400,
      height: 630,
    },
    (window) => {
      // store the ID of the popup
      extensionPopupWindowId = window.id;

      // listen for a response from the popup
      listenForPopupResponse(popupResponseHandler);
    },
  );
};

// listenForPopupResponse registers a handler to wait for the wallet extension popup
// to respond to the wallet provider request
const listenForPopupResponse = (
  popupResponseHandler: (response: ProviderEvent) => void,
) => {
  chrome.runtime.onMessage.addListener(function listener(
    response: ProviderEvent,
  ) {
    // ensure the expected response type is handled
    if (isResponseType(response.type)) {
      // cleanup the listener and handle the response
      chrome.runtime.onMessage.removeListener(listener);
      popupResponseHandler(response);
    }
  });
};
