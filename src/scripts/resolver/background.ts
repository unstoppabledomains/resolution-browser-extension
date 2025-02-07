import {Logger} from "../../lib/logger";
import {getSupportedTlds} from "../../lib/resolver/resolver";
import {
  RESOLUTION_REDIRECT_URL,
  SUPPORTED_DOMAIN_REFRESH_MINUTES,
} from "../../lib/resolver/types";

export const waitForSupportedDomains = async () => {
  // start by checking for availability of supported domains, and then
  // removing all rules on extension if they are found. This first check
  // keeps us from clearing rules when the API is unavailable.
  const supportedDomains = await getSupportedTlds();
  if (supportedDomains && supportedDomains.length > 0) {
    await deleteAllRules();
  }

  // make an initial call to initialize dynamic rules
  await refreshRules();

  // schedule a timer to check for updates periodically
  const alarmName = "refreshRules";
  await chrome.alarms.create(alarmName, {
    delayInMinutes: SUPPORTED_DOMAIN_REFRESH_MINUTES,
    periodInMinutes: SUPPORTED_DOMAIN_REFRESH_MINUTES,
  });
  chrome.alarms.onAlarm.addListener(async (alarm: chrome.alarms.Alarm) => {
    if (alarm.name === alarmName) {
      await refreshRules();
    }
  });

  // listen for required permission to become available
  if (!chrome.declarativeNetRequest) {
    Logger.log(
      "Waiting for declarativeNetRequest permission to be available...",
    );
    chrome.permissions.onAdded.addListener(async p => {
      if (
        p?.permissions?.includes("declarativeNetRequest") ||
        p?.permissions?.includes("declarativeNetRequestWithHostAccess")
      ) {
        try {
          Logger.log("Detected declarativeNetRequest permission!");
          chrome.runtime.reload();
        } catch (e) {
          Logger.warn("Error in declarativeNetRequest callback", e);
        }
      }
    });
  }
};

const refreshRules = async () => {
  // retrieve the current list of supported domains
  const supportedDomains = await getSupportedTlds();

  // update the dynamic rules with supported domain list
  await updateDomainRules(supportedDomains);
};

const getRules = async () => {
  try {
    return await chrome.declarativeNetRequest.getDynamicRules();
  } catch (e) {
    Logger.log("declarativeNetRequest permission not available");
  }
  return undefined;
};

const getDomainRule = (domain: string) => {
  return `https?://([^/]*?\\.${domain})(/|$)`;
};

const deleteAllRules = async () => {
  const rules = await getRules();
  if (!rules) {
    Logger.log("No dynamic rules detected");
    return;
  }
  const ruleIds = rules.map(rule => rule.id);
  if (ruleIds.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ruleIds,
    });
    Logger.log("All dynamic rules have been removed successfully.");
  } else {
    Logger.log("No dynamic rules to remove.");
  }
};

const updateDomainRules = async (domains: string[]): Promise<string[]> => {
  // determine which domains require a rule to be added
  Logger.log("Checking HTTP rules...");
  const newDomains: string[] = [];
  const existingRules = await getRules();
  if (!existingRules) {
    return [];
  }
  domains.map(d => {
    if (
      !existingRules.find(r => r.condition.regexFilter === getDomainRule(d))
    ) {
      newDomains.push(d);
    }
  });

  // no rules are required to be added
  if (newDomains.length === 0) {
    Logger.log("HTTP rules are up to date");
    return [];
  }

  // add the HTTP redirect rules
  Logger.log("Adding HTTP rules...", {domains: newDomains});
  for (let i = 0; i < newDomains.length; i++) {
    const d = newDomains[i];
    const urlRegex = getDomainRule(d);
    const id = i + existingRules.length + 1001;
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [
        {
          id,
          action: {
            type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
            redirect: {
              regexSubstitution: `${RESOLUTION_REDIRECT_URL}\\1`,
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
  }

  // add search engine rules
  Logger.log("Adding search engines rules...", {domains: newDomains});
  for (let i = 0; i < newDomains.length; i++) {
    const d = newDomains[i];
    const urlRegex = `https?://.*[?&]q=([^&]*?\\b\\.${d})(&|$)`;
    const id = i + existingRules.length + 2001;
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [
        {
          id,
          action: {
            type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
            redirect: {
              regexSubstitution: `${RESOLUTION_REDIRECT_URL}\\1`,
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
  }

  // return the updated domains
  return newDomains;
};
