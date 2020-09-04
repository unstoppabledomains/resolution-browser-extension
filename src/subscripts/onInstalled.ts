import {
  chromeStorageSyncSet,
  chromeStorageSyncClear,
  StorageSyncKey,
} from '../util/chromeStorageSync'
import { ExtensionOptions, ExtensionURIMap } from '../types'

console.log('Background Script Started!')

chrome.runtime.onInstalled.addListener(details => {
  chromeStorageSyncClear().then(async () => {
    await chromeStorageSyncSet(
      StorageSyncKey.GatewayBaseURL,
      ExtensionURIMap[ExtensionOptions.IPFSNetwork],
    );
    await chromeStorageSyncSet(
      StorageSyncKey.GatewayOption, ExtensionOptions.IPFSNetwork
    );
  });
  chrome.tabs.create({url: 'index.html#install'})
  console.log('Installed!')
})
