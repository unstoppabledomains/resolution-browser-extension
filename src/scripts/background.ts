import Resolution, { ResolutionError, ResolutionErrorCode } from '@unstoppabledomains/resolution'
import '../subscripts/onInstalled'
import {chromeStorageSyncGet, StorageSyncKey} from '../util/chromeStorageSync'
import isValidDNSHostname from '../util/isValidDNSHostname'
import { invert } from '../util/helpers'

chrome.webRequest.onBeforeRequest.addListener(
  requestDetails => {
    const url = new URL(requestDetails.url)
    const q = url.searchParams.get('q').trim()
    console.log({q});
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

const resolution = new Resolution({
  blockchain: {
    ens: {
      url: 'https://mainnet.infura.io/v3/213fff28936343858ca9c5115eff1419'
    },
    cns: {
      url: 'https://mainnet.infura.io/v3/213fff28936343858ca9c5115eff1419' 
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
        chrome.tabs.update({
          url: `${gatewayBaseURL}ipfs/${ipfsHash}`,
        });
      }catch(err) {
        let message = err.message
        if (err instanceof ResolutionError) {
          if (err.code === ResolutionErrorCode.RecordNotFound) message = "Ipfs page not found";
        }       
        chrome.tabs.update({url: `index.html#error?reason=${message}`});
      }
    });
    return {cancel: true}
  },
  {
    urls: [
      '*://*.crypto/*',
      '*://*.zil/*'
    ],
    types: ['main_frame']},
)
