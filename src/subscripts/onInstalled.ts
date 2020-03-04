import {
  chromeStorageSyncGet,
  chromeStorageSyncSet,
  StorageSyncKey,
} from '../util/chromeStorageSync'
import { ExtensionOptions, ExtensionURIMap } from '../types'

console.log('Background Script Started!')

chrome.runtime.onInstalled.addListener(details => {
  chromeStorageSyncGet(StorageSyncKey.GatewayBaseURL).then(baseURL => {
    if (!baseURL) {
      chromeStorageSyncSet(
        StorageSyncKey.GatewayBaseURL,
        new URL(ExtensionURIMap[ExtensionOptions.Pinata]).href,
      );
      chromeStorageSyncSet(
        StorageSyncKey.GatewayOption, ExtensionOptions.Pinata
      );
    }
  })

  // if (details.reason == 'install') {
  chrome.tabs.create({url: 'index.html#install'})

  console.log('Installed!')
})
