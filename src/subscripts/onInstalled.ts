import {
  chromeStorageSyncGet,
  chromeStorageSyncSet,
  StorageSyncKey,
} from '../util/chromeStorageSync'

console.log('Background Script Started!')

chrome.runtime.onInstalled.addListener(details => {
  chromeStorageSyncGet(StorageSyncKey.GatewayBaseURL).then(baseURL => {
    if (!baseURL) {
      chromeStorageSyncSet(
        StorageSyncKey.GatewayBaseURL,
        new URL('http://gateway.ipfs.io').href,
      )
    }
  })

  // if (details.reason == 'install') {
  chrome.tabs.create({url: 'index.html#install'})

  console.log('Installed!')
})
