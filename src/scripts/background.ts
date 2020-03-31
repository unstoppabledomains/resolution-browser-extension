import Resolution, { ResolutionError, ResolutionErrorCode } from '@unstoppabledomains/resolution'
import '../subscripts/onInstalled'
import { chromeStorageSyncGet, StorageSyncKey } from '../util/chromeStorageSync'
import isValidDNSHostname from '../util/isValidDNSHostname'

function supportedDomain(q: string) {
  return (q.endsWith('.zil') || q.endsWith('.crypto') || q.endsWith('.eth'))
}

chrome.webRequest.onBeforeRequest.addListener(
  requestDetails => {
    const url = new URL(requestDetails.url)
    const params = url.searchParams.get('q').trim().toLowerCase()
    const q = new URL(url.protocol + '//' + params)
    if (
      !q.hostname ||
      !isValidDNSHostname(q.hostname) ||
      !supportedDomain(q.hostname) ||
      url.pathname !== '/search'
    ) {
      return
    }
    chrome.tabs.update({url: q.toString()})
    return {cancel: true}
  },
  {
    urls: [
      '*://*.google.com/*'
    ],
    types: ['main_frame']
  },
  ['blocking'],
)

const resolution = new Resolution({
  blockchain: {
    ens: {
      url: 'https://mainnet.infura.io/v3/350101a50e4c4319bcafc44313daf5dc'
    },
    cns: {
      url: 'https://mainnet.infura.io/v3/350101a50e4c4319bcafc44313daf5dc' 
    }
  }
})

chrome.webRequest.onBeforeRequest.addListener(
  requestDetails => {
    chrome.tabs.update({url: 'index.html#loading'}, async (tab: chrome.tabs.Tab) => {
      const gatewayBaseURL = new URL(
        (await chromeStorageSyncGet(StorageSyncKey.GatewayBaseURL)) ||
          'http://gateway.ipfs.io',
      ).href
      try {
        const url = new URL(requestDetails.url);
        const ipfsHash = await resolution.ipfsHash(url.hostname);
        const displayUrl  = `${gatewayBaseURL}ipfs/${ipfsHash}${url.pathname}`;
        chrome.tabs.update({
          url: displayUrl,
        });
      } catch(err) {
        let message = err.message;
        if (err instanceof ResolutionError) {
          if (err.code === ResolutionErrorCode.RecordNotFound) message = "Ipfs page not found";
      }       
      chrome.tabs.update({url: `index.html#error?reason=${message}`});
    }
    return {cancel: true}
  })},
  {
    urls: [
      '*://*.crypto/*',
      '*://*.zil/*',
      '*://*.eth/*',
    ],
    types: ['main_frame']
  },
  ["blocking"]
)
