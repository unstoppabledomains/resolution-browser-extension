import {Logger} from "../../lib/logger";
import {getSupportedTlds} from "../../lib/resolver/resolver";
import {
  RESOLUTION_REDIRECT_URL,
  SUPPORTED_DOMAIN_REFRESH_MINUTES,
} from "../../lib/resolver/types";

export const waitForSupportedDomains = async () => {
  // start be removing all rules on extension startup
  await deleteAllRules();

  // make an initial call to initialize dynamic rules
  await refreshRules();

  // schedule a timer to check for updates periodically
  chrome.alarms.create("refreshRules", {
    delayInMinutes: SUPPORTED_DOMAIN_REFRESH_MINUTES,
    periodInMinutes: SUPPORTED_DOMAIN_REFRESH_MINUTES,
  });
  chrome.alarms.onAlarm.addListener(async (alarm: chrome.alarms.Alarm) => {
    if (alarm.name === "refreshRules") {
      await refreshRules();
    }
  });
};

const refreshRules = async () => {
  // retrieve the current list of supported domains
  const supportedDomains = await getSupportedTlds();

  // update the dynamic rules with supported domain list
  await updateDomainRules(supportedDomains);
};

const getRules = async () => {
  return await chrome.declarativeNetRequest.getDynamicRules();
};

const getDomainRule = (domain: string) => {
  return `https?://([^/]*?\\.${domain})(/|$)`;
};

const deleteAllRules = async () => {
  const rules = await getRules();
  const ruleIds = rules.map((rule) => rule.id);
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
  domains.map((d) => {
    if (
      !existingRules.find((r) => r.condition.regexFilter === getDomainRule(d))
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
  newDomains.map((d, i) => {
    const urlRegex = getDomainRule(d);
    const id = i + existingRules.length + 1001;
    chrome.declarativeNetRequest.updateDynamicRules({
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
  });

  // add search engine rules
  Logger.log("Adding search engines rules...", {domains: newDomains});
  newDomains.map((d, i) => {
    const urlRegex = `https?://.*[?&]q=([^&]*?\\b\\.${d})(&|$)`;
    const id = i + existingRules.length + 2001;
    chrome.declarativeNetRequest.updateDynamicRules({
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
  });

  // return the updated domains
  return newDomains;
};
