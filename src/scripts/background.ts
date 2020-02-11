import Resolution from '@unstoppabledomains/resolution'
import '../subscripts/onInstalled'
import {chromeStorageSyncGet, StorageSyncKey} from '../util/chromeStorageSync'
import isValidDNSHostname from '../util/isValidDNSHostname'

chrome.webRequest.onBeforeRequest.addListener(
  requestDetails => {
    const url = new URL(requestDetails.url)
    const q = url.searchParams.get('q').trim()

    if (
      !q ||
      !isValidDNSHostname(q) ||
      !/\.(zil|crypto)$/.test(q) ||
      url.pathname !== '/search'
    ) {
      return
    }

    chrome.tabs.update({url: 'http://' + q})

    return {cancel: true}
  },
  {urls: ['*://*.google.com/*'], types: ['main_frame']},
  ['blocking'],
)

const resolution = new Resolution()

chrome.webRequest.onBeforeRequest.addListener(
  requestDetails => {
    chrome.tabs.update({url: '/loading.html'}, async () => {
      const gatewayBaseURL = new URL(
        (await chromeStorageSyncGet(StorageSyncKey.GatewayBaseURL)) ||
          'http://gateway.ipfs.io',
      ).href

      chrome.tabs.update({
        url: `${gatewayBaseURL}ipfs/${await resolution.ipfsHash(
          new URL(requestDetails.url).hostname,
        )}`,
      })
    })

    return {cancel: true}
  },
  {
    urls: [
      '*://*.crypto/*',
      '*://*.zil/*'
    ],
    types: ['main_frame']},
)
