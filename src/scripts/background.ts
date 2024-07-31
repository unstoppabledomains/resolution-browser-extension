import "../subscripts/onInstalled";
import {supportedDomains} from "../util/helpers";

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
    const urlRegex = `https?://([^/]*?\.${domain})(/|$)`;
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

const popupUrl = chrome.runtime.getURL("index.html#connect");
let selectAccountWindowId = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (
    request.type === "selectAccountRequest" ||
    request.type === "selectChainIdRequest" ||
    request.type === "signMessageRequest"
  ) {
    if (selectAccountWindowId) {
      chrome.tabs.query({windowId: selectAccountWindowId}, (tabs) => {
        if (tabs.length === 0) {
          selectAccountWindowId = null;
          openConnectWindow(request, sendResponse, popupUrl);
        } else {
          handleRequestInExistingWindow(request, sendResponse, tabs[0].id);
        }
      });
    } else {
      openConnectWindow(request, sendResponse, popupUrl);
    }
    return true;
  }
});

function openConnectWindow(request, sendResponse, popupUrl) {
  chrome.windows.create(
    {
      url: popupUrl,
      type: "popup",
      width: 400,
      height: 600,
    },
    (window) => {
      selectAccountWindowId = window.id;
      const tabId = window.tabs[0].id;

      handleRequestInExistingWindow(request, sendResponse, tabId);
    },
  );
}

function handleRequestInExistingWindow(request, sendResponse, tabId) {
  chrome.runtime.onMessage.addListener(function listener(response) {
    if (
      response.type === "selectAccountResponse" ||
      response.type === "selectChainIdResponse" ||
      response.type === "signMessageResponse"
    ) {
      chrome.runtime.onMessage.removeListener(listener);
      sendResponse(response);
    }
  });
}
