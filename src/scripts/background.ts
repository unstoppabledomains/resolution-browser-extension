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
    const q = url.searchParams.get('q').trim().toLowerCase()
    if (
      !q ||
      !isValidDNSHostname(q) ||
      !supportedDomain(q) ||
      url.pathname !== '/search'
    ) {
      return
    }

    chrome.tabs.update({url: 'http://' + q})

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
        const url = new URL(requestDetails.url).hostname;
        const ipfsHash = await resolution.ipfsHash(url);
        const displayUrl  = `${gatewayBaseURL}ipfs/${ipfsHash}`;
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
    });
    return { cancel: true }
  },
  {
    urls: [
      '*://*.crypto/*',
      '*://*.zil/*',
      '*://*.eth/*',
    ],
    types: ['main_frame']
  }
)
