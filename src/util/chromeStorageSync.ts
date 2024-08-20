export enum StorageSyncKey {
  GatewayBaseURL = "GatewayBaseURL",
  GatewayOption = "GatewayOption",
  BookmarkedDomains = "BookmarkedDomains",
}

export function chromeStorageSyncClear(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.clear(resolve);
  });
}

export function chromeStorageSyncGet(keys: StorageSyncKey): Promise<any> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(keys, (items) => resolve(items[keys]));
  });
}

export function chromeStorageSyncSet(
  key: StorageSyncKey,
  value: string,
): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({[key]: value}, resolve);
  });
}

export function chromeStorageSyncRemove(key: StorageSyncKey): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.remove(key, resolve);
  });
}
