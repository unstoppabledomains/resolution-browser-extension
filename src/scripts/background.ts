import Resolution, { ResolutionError, ResolutionErrorCode } from '@unstoppabledomains/resolution'
import '../subscripts/onInstalled'
import { chromeStorageSyncGet, StorageSyncKey } from '../util/chromeStorageSync'
import isValidDNSHostname from '../util/isValidDNSHostname'

function supportedDomain(q: string) {
  return (
    q.endsWith('.zil') ||
    q.endsWith('.crypto') ||
    q.endsWith('.eth'))
}

async function redirectToIpfs(domain: string) {
  const resolution = new Resolution({
    blockchain: {
      ens: {
        url: 'https://mainnet.infura.io/v3/350101a50e4c4319bcafc44313daf5dc'
      },
      cns: {
        url: 'https://mainnet.infura.io/v3/350101a50e4c4319bcafc44313daf5dc'
      }
    }
  });
  const gatewayBaseURL = new URL(
    (await chromeStorageSyncGet(StorageSyncKey.GatewayBaseURL)) || 'http://gateway.ipfs.io'
  ).href;
  try {
    const url = new URL(domain);
    const ipfsHash = await resolution.ipfsHash(url.hostname);
    const displayUrl = `${gatewayBaseURL}ipfs/${ipfsHash}${url.pathname}`;
    chrome.tabs.update({
      url: displayUrl
    });
  } catch (err) {
    let message = err.message;
    if (err instanceof ResolutionError) {
      if (err.code === ResolutionErrorCode.RecordNotFound) {
        const url = new URL(domain);
        const redirectUrl = await resolution.httpUrl(url.hostname).catch(err => undefined);
        if (!redirectUrl) chrome.tabs.update({ url: `https://unstoppabledomains.com/search?searchTerm=${url.hostname}&searchRef=chrome-extension` });
        chrome.tabs.update({url: redirectUrl});
      }
    } else
    // 
      chrome.tabs.update({ url: `index.html#error?reason=${message}` });
  }
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

chrome.webRequest.onBeforeRequest.addListener(
  requestDetails => {
    chrome.tabs.update({url: 'index.html#loading'}, async (tab: chrome.tabs.Tab) => {
      await redirectToIpfs(requestDetails.url);
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
