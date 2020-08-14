import Resolution, {
  ResolutionError,
  ResolutionErrorCode,
} from '@unstoppabledomains/resolution'
import {chromeStorageSyncGet, StorageSyncKey} from './chromeStorageSync'

export function invert(object) {
  const returnee = {}

  for (const key in object) {
    if (!object.hasOwnProperty(key)) continue
    returnee[object[key]] = key
  }
  return returnee
}

export async function redirectToIpfs(domain: string) {
  const resolution = new Resolution({
    blockchain: {
      ens: {
        url: 'https://mainnet.infura.io/v3/350101a50e4c4319bcafc44313daf5dc',
      },
      cns: {
        url: 'https://mainnet.infura.io/v3/350101a50e4c4319bcafc44313daf5dc',
      },
    },
  })
  const gatewayBaseURL = new URL(
    (await chromeStorageSyncGet(StorageSyncKey.GatewayBaseURL)) ||
      'http://gateway.ipfs.io',
  ).href
  try {
    const url = new URL(domain)
    const ipfsHash = await resolution.ipfsHash(url.hostname)
    const displayUrl = `${gatewayBaseURL}ipfs/${ipfsHash}${url.pathname}`
    chrome.tabs.update({
      url: displayUrl,
    })
  } catch (err) {
    let message = err.message
    if (err instanceof ResolutionError) {
      if (err.code === ResolutionErrorCode.RecordNotFound) {
        const url = new URL(domain)
        const redirectUrl = await resolution
          .httpUrl(url.hostname)
          .catch(err => undefined)
        if (!redirectUrl)
          chrome.tabs.update({
            url: `https://unstoppabledomains.com/search?searchTerm=${url.hostname}&searchRef=chrome-extension`,
          })
        chrome.tabs.update({url: redirectUrl})
      }
    }
    //
    else chrome.tabs.update({url: `index.html#error?reason=${message}`})
  }
}


//domain names supported
export const supportedDomains: string[] = [
  '.eth',
  '.crypto',
  '.zil'
]

//return true if url ends in one of the supported domains
export const supportedDomain = (q: string): boolean => supportedDomains.some((d: string): boolean => q.endsWith(d))
