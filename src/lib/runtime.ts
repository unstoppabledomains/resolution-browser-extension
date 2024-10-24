import {Logger} from "./logger";
import Bluebird from "bluebird";
import {XMTP_CONVERSATION_FLAG} from "../types/wallet/messages";
import {StorageSyncKey, chromeStorageGet} from "./chromeStorage";
import rgbHex from "rgb-hex";
import {sleep} from "./wallet/sleep";

export enum BadgeColor {
  Blue = "#1976d2",
  Green = "#4caf50",
}

const permissions = ["contextMenus", "notifications", "tabs"];

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
    // ignore error, which can happen if this method is called from
    // a context where chrome.runtime is not available.
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

export const getBadgeCount = async (color: BadgeColor) => {
  // determine if color matches query
  const currentRgb = await chrome.action.getBadgeBackgroundColor({});
  const currentHex = rgbHex(currentRgb[0], currentRgb[1], currentRgb[2]);
  if (!color.toLowerCase().includes(currentHex.toLowerCase())) {
    return 0;
  }

  // get current count
  let currentCount = await chrome.action.getBadgeText({});
  if (!currentCount) {
    currentCount = "0";
  }
  try {
    return parseInt(currentCount);
  } catch (e) {
    // ignore error
  }
  return 0;
};

export const incrementBadgeCount = async (color: BadgeColor) => {
  const currentCount = await getBadgeCount(color);
  await setBadgeCount(currentCount + 1, color);
};

export const setBadgeCount = async (
  count: number,
  color: BadgeColor = BadgeColor.Green,
) => {
  await chrome.action.setBadgeBackgroundColor({color});
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

  // if no popup was found to focus, try alternative method
  if (focussedCount === 0) {
    return await focusKnownPopup();
  }
  return focussedCount;
};

export const focusKnownPopup = async () => {
  try {
    const windowId = await chromeStorageGet<number>(
      StorageSyncKey.WindowId,
      "session",
    );
    if (windowId) {
      await chrome.windows.update(windowId, {focused: true});
      return 1;
    }
  } catch (e) {
    // ignore error
  }
  return 0;
};

export const createNotification = async (
  id: string,
  title: string,
  message: string,
  contextMessage?: string,
  priority?: number,
) => {
  if (chrome.notifications) {
    // a callback to determine when the notification is finished
    let isComplete = false;
    const callback = () => {
      isComplete = true;
    };

    // request the notification to be created
    chrome.notifications.create(
      id,
      {
        type: "basic",
        title,
        iconUrl: chrome.runtime.getURL("/icon/128.png"),
        message,
        isClickable: true,
        contextMessage,
        priority,
      },
      callback,
    );

    // wait for complete
    while (!isComplete) {
      await sleep(250);
    }
  }
};

export const openSidePanel = async (opts?: {
  address?: string;
  windowId?: number;
}) => {
  if (chrome.sidePanel) {
    try {
      // determine the current window ID
      const windowId =
        opts?.windowId || (await chrome.windows.getCurrent())?.id;
      if (!windowId) {
        return false;
      }

      // build the URL used to open the side panel
      const sidePanelUrl = `${chrome.runtime.getURL(`index.html${opts?.address ? `?${XMTP_CONVERSATION_FLAG}=${opts.address}` : ""}`)}#messages`;

      // open the side panel and set the URL concurrently, to avoid a timing
      // bug in the chrome user gesture flag handling
      await Promise.all([
        chrome.sidePanel.open({windowId}),
        chrome.sidePanel.setOptions({enabled: true, path: sidePanelUrl}),
      ]);
      return true;
    } catch (e) {
      // gracefully handle the error and fallback to opening the chat within
      // the same window instead of side panel
      Logger.warn(e, "Popup", "Unable to open message side panel");
    }
  }
  return false;
};
