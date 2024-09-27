import {Logger} from "./logger";
import Bluebird from "bluebird";
import {XMTP_CONVERSATION_FLAG} from "../types/wallet/messages";

const permissions = ["contextMenus", "notifications", "sidePanel", "tabs"];

export const hasOptionalPermissions = async (): Promise<boolean> => {
  return await chrome.permissions.contains({permissions});
};

export const requestOptionalPermissions = async (): Promise<boolean> => {
  // determine if permissions are already granted
  if (await hasOptionalPermissions()) {
    return true;
  }

  // request permissions if not already granted
  const isGranted = await chrome.permissions.request({
    permissions,
  });

  // show a notification when permissions granted
  if (isGranted) {
    // create a notification to indicate sign in was successful
    await createNotification(
      `permissions${Date.now()}`,
      "Unstoppable Domains",
      "Your wallet is ready to use! Click to open.",
      undefined,
      2,
    );
  }
  return isGranted;
};

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

export const incrementBadgeCount = async (
  color: "blue" | "green" = "green",
) => {
  let currentCount = await chrome.action.getBadgeText({});
  if (!currentCount) {
    currentCount = "0";
  }
  try {
    await setBadgeCount(parseInt(currentCount) + 1, color);
  } catch (e) {
    Logger.warn("unable to increment badge count", e);
  }
};

export const setBadgeCount = async (
  count: number,
  color: "blue" | "green" = "green",
) => {
  await chrome.action.setBadgeBackgroundColor({
    color: color === "green" ? "#4caf50" : "#1976d2",
  });
  await chrome.action.setBadgeTextColor({color: "#ffffff"});
  await chrome.action.setBadgeText({text: count > 0 ? String(count) : ""});
};

export const focusExtensionWindows = async (
  windowType?: chrome.tabs.QueryInfo["windowType"],
) => {
  let focussedCount = 0;
  try {
    // retrieve all active windows for requested type
    const allOpenWindows = await chrome.tabs.query({windowType});
    const extensionBaseUrl = chrome.runtime.getURL("");

    // focus for side panels
    await Bluebird.map(allOpenWindows, async (tab) => {
      if (tab.url?.includes(extensionBaseUrl)) {
        await chrome.windows.update(tab.windowId, {focused: true});
        focussedCount++;
      }
    });
  } catch (e) {
    // ignore error
  }
  return focussedCount;
};

export const createNotification = async (
  id: string,
  title: string,
  message: string,
  contextMessage?: string,
  priority?: number,
) => {
  if (chrome.notifications) {
    chrome.notifications.create(id, {
      type: "basic",
      title,
      iconUrl: chrome.runtime.getURL("/icon/128.png"),
      message,
      isClickable: true,
      contextMessage,
      priority,
    });
  }
};

export const openSidePanel = async (address?: string) => {
  if (chrome.sidePanel) {
    try {
      // determine the current window ID
      const currentWindow = await chrome.windows.getCurrent();
      if (!currentWindow?.id) {
        return;
      }

      // build the URL used to open the side panel
      const sidePanelUrl = `${chrome.runtime.getURL(`index.html${address ? `?${XMTP_CONVERSATION_FLAG}=${address}` : ""}`)}#messages`;

      // open the side panel
      await chrome.sidePanel.setOptions({enabled: true, path: sidePanelUrl});
      await chrome.sidePanel.open({windowId: currentWindow.id});
      return true;
    } catch (e) {
      // gracefully handle the error and fallback to opening the chat within
      // the same window instead of side panel
      Logger.error(e, "Popup", "Unable to open message side panel");
    }
  }
  return false;
};
