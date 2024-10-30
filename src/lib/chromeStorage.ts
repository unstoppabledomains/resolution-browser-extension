import {Logger} from "./logger";

export enum StorageSyncKey {
  AuthState = "AuthState",
  Account = "Account",
  GatewayBaseURL = "GatewayBaseURL",
  GatewayOption = "GatewayOption",
  BookmarkedDomains = "BookmarkedDomains",
  WalletConnections = "WalletConnections",
  WalletPreferences = "WalletPreferences",
  CompatibilityModeCta = "CompatibilityModeCta",
  WindowId = "windowId",
  XmtpKey = "XmtpKey",
  XmtpNotifications = "XmtpNotifications",
  FireblocksState = "fireblocks-state",
}

type StorageType = "local" | "session" | "sync";

export const chromeStorageClear = async (type: StorageType = "sync") => {
  Logger.warn("Clearing storage");
  await chrome.storage[type].clear();
};

export const chromeStorageGet = async <T>(
  k: StorageSyncKey,
  type: StorageType = "sync",
): Promise<T> => {
  const data = await chrome.storage[type].get(k);
  return data[k];
};

export const chromeStorageSet = async (
  k: StorageSyncKey,
  v: any,
  type: StorageType = "sync",
) => {
  try {
    Logger.log("Setting storage key", type, k);
    await chrome.storage[type].set({[k]: v});
  } catch (e) {
    Logger.warn("Error storing key", e, type, k);
  }
};

export const chromeStorageRemove = async (
  k: StorageSyncKey,
  type: StorageType = "sync",
) => {
  Logger.log("Removing storage key", type, k);
  await chrome.storage[type].remove(k);
};
