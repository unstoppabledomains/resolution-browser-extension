import "../subscripts/onInstalled";
import {supportedDomains} from "../lib/helpers";
import {backgroundEventListener} from "./liteWalletProvider/background";
import {Logger} from "../lib/logger";

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
          Logger.log("All dynamic rules have been removed successfully.");
        },
      );
    } else {
      Logger.log("No dynamic rules to remove.");
    }
  });
}

function addRules() {
  Logger.log("Adding HTTP rules...");
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

  Logger.log("Adding search engines rules...");
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

// register the wallet popup event listener
chrome.runtime.onMessage.addListener(backgroundEventListener);
