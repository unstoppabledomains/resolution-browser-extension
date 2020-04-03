export enum StorageSyncKey {
  GatewayBaseURL = 'GatewayBaseURL',
  GatewayOption = "GatewayOption",
  BookmarkedDomains = "BookmarkedDomains",
  ResolvedDomains = "ResolvedDomains"
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

export async function checkResolutionFromLocalCache(domain: string): Promise<string | undefined> {
  const jsonCache =  await chromeStorageSyncGet(StorageSyncKey.ResolvedDomains) || "{}";
  const cache = JSON.parse(jsonCache);
  return cache[domain];
}

export async function putResolutionIntoLocalCache(domain: string, ipfsHash: string): Promise<void> {
  const jsonCache = await chromeStorageSyncGet(StorageSyncKey.ResolvedDomains) || "{}";
  const cache = JSON.parse(jsonCache);
  cache[domain] = ipfsHash;
  return await chromeStorageSyncSet(StorageSyncKey.ResolvedDomains, JSON.stringify(cache));
}