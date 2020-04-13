import {
  chromeStorageSyncGet,
  chromeStorageSyncSet,
  StorageSyncKey,
} from '../util/chromeStorageSync'
import { ExtensionOptions, ExtensionURIMap } from '../types'

console.log('Background Script Started!')

chrome.runtime.onInstalled.addListener(details => {
  chromeStorageSyncGet(StorageSyncKey.GatewayBaseURL).then(async (baseURL) => {
    if (!baseURL) {
      await chromeStorageSyncSet(
        StorageSyncKey.GatewayBaseURL,
        new URL(ExtensionURIMap[ExtensionOptions.CloudflareCDN]).href,
      );
      await chromeStorageSyncSet(
        StorageSyncKey.GatewayOption, ExtensionOptions.CloudflareCDN
      );
    }
  })
  chrome.tabs.create({url: 'index.html#install'})
  console.log('Installed!')
})
