import {Logger} from "./logger";
import Bluebird from "bluebird";

export const getManifestVersion = () => {
  try {
    return chrome.runtime.getManifest().version;
  } catch (e) {
    Logger.warn("unable to determine version", e);
  }
  return undefined;
};

export const setIcon = async (
  variant: "default" | "connected",
  tabId?: number,
) => {
  // find the current tab ID if not provided
  if (!tabId) {
    const allWindows = await chrome.windows.getAll({populate: true});
    for (const window of allWindows) {
      if (!window.tabs) {
        continue;
      }
      for (const tab of window.tabs) {
        if (!tab.id) {
          continue;
        }
        setIcon(variant, tab.id);
      }
    }
    return;
  }

  // update the requested tab
  Logger.log("Updating connection icon", JSON.stringify({tabId, variant}));
  const suffix = variant === "default" ? "" : `-${variant}`;
  await chrome.action.setIcon({
    path: {
      16: `icon/16${suffix}.png`,
      38: `icon/38${suffix}.png`,
      48: `icon/48${suffix}.png`,
      128: `icon/128${suffix}.png`,
    },
    tabId,
  });
};

export const setBadgeCount = async (count: number) => {
  await chrome.action.setBadgeBackgroundColor({color: "#4caf50"});
  await chrome.action.setBadgeTextColor({color: "#ffffff"});
  await chrome.action.setBadgeText({text: count > 0 ? String(count) : ""});
};

export const getAllPopups = async (): Promise<number[]> => {
  const popupTabs = await chrome.tabs.query({windowType: "popup"});
  return [...new Set(popupTabs.map((t) => t.windowId))];
};

export const focusAllPopups = async () => {
  const allWindows = await getAllPopups();
  Bluebird.map(allWindows, async (windowId) => {
    await chrome.windows.update(windowId, {focused: true});
  });
};
