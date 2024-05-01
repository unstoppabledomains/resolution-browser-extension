import "../subscripts/onInstalled";
import {supportedDomains} from "../util/helpers";

// TODO: Update it to use the new API
const RESOLUTION_URL = "http://localhost:8081/";
const REDIRECT_URL = `${RESOLUTION_URL}redirect?url=`;

const domainsList = supportedDomains.map(domain => domain.replace(".", ""));

function deleteAllRules() {
  chrome.declarativeNetRequest.getDynamicRules(rules => {
    const ruleIds = rules.map(rule => rule.id);

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
