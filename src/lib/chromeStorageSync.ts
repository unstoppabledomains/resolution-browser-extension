import {Logger} from "./logger";

export enum StorageSyncKey {
  GatewayBaseURL = "GatewayBaseURL",
  GatewayOption = "GatewayOption",
  BookmarkedDomains = "BookmarkedDomains",
  WalletConnections = "WalletConnections",
  WalletPreferences = "WalletPreferences",
}

export const chromeStorageSyncClear = async () => {
  Logger.warn("Clearing storage");
  await chrome.storage.sync.clear();
};

export const chromeStorageSyncGet = async (k: StorageSyncKey): Promise<any> => {
  Logger.log("Retrieving storage key", k);
  const data = await chrome.storage.sync.get(k);
  return data[k];
};

export const chromeStorageSyncSet = async (k: StorageSyncKey, v: string) => {
  try {
    Logger.log("Setting storage key", JSON.stringify({k, v}));
    await chrome.storage.sync.set({[k]: v});
  } catch (e) {
    Logger.warn("Error storing key", e, JSON.stringify({k, v}));
  }
};

export const chromeStorageSyncRemove = async (k: StorageSyncKey) => {
  Logger.log("Removing storage key", k);
  await chrome.storage.sync.remove(k);
};
