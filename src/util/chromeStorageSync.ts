export enum StorageSyncKey {
  GatewayBaseURL = 'GatewayBaseURL',
  GatewayOption = "GatewayOption"
}

export function chromeStorageSyncGet(keys: StorageSyncKey): Promise<any> {
  return new Promise(resolve => {
    chrome.storage.sync.get(keys, items => resolve(items[keys]))
  })
}

export function chromeStorageSyncSet(
  key: StorageSyncKey,
  value: string,
): Promise<void> {
  return new Promise(resolve => {
    chrome.storage.sync.set({[key]: value}, resolve)
  })
}
