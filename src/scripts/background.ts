import "../subscripts/onInstalled";
import {ProviderRequest, isRequestType, isResponseType} from "../types/wallet";
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

let selectAccountWindowId = null;

chrome.runtime.onMessage.addListener(
  (request: ProviderRequest, sender, sendResponse) => {
    if (isRequestType(request.type)) {
      chrome.tabs
        .query({
          active: true,
          lastFocusedWindow: true,
        })
        .then((tabs) => {
          const requestSource = tabs[0];
          const requestUrl = chrome.runtime.getURL(
            `index.html?request=${encodeURIComponent(JSON.stringify(request))}&source=${encodeURIComponent(JSON.stringify(requestSource))}#connect`,
          );
          if (selectAccountWindowId) {
            chrome.tabs.query({windowId: selectAccountWindowId}, (tabs) => {
              if (tabs.length === 0) {
                selectAccountWindowId = null;
                openConnectWindow(request, sendResponse, requestUrl);
              } else {
                handleRequestInExistingWindow(
                  request,
                  sendResponse,
                  tabs[0].id,
                );
              }
            });
          } else {
            openConnectWindow(request, sendResponse, requestUrl);
          }
        });

      return true;
    }
  },
);

function openConnectWindow(request, sendResponse, popupUrl) {
  chrome.windows.create(
    {
      url: popupUrl,
      type: "popup",
      width: 400,
      height: 630,
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
    if (isResponseType(response.type)) {
      chrome.runtime.onMessage.removeListener(listener);
      sendResponse(response);
    }
  });
}
