import Resolution, {
  ResolutionError,
  ResolutionErrorCode,
} from '@unstoppabledomains/resolution'
import { chromeStorageSyncGet, StorageSyncKey } from './chromeStorageSync'
import ipfsClient from "ipfs-http-client";

export function invert(object) {
  const returnee = {}

  for (const key in object) {
    if (!object.hasOwnProperty(key)) continue
    returnee[object[key]] = key
  }
  return returnee
}

function placeIpfs(hash: string, url: string): string {
  const regexPatern = /{ipfs}/gi;
  return url.replace(regexPatern, hash);
}

function isConvertableToV1base32Hash(hash: string, url: string): boolean {
  const parts = url.split('.');
  if (!parts[0].includes("{ipfs}")) return false;
  return hash.length == 46 && hash.startsWith("Qm")
}

export async function redirectToIpfs(domain: string, tabId?: number) {
  const resolution = new Resolution({
    blockchain: {
      ens: {
        url: 'https://mainnet.infura.io/v3/350101a50e4c4319bcafc44313daf5dc',
      },
      cns: {
        url: 'https://mainnet.infura.io/v3/350101a50e4c4319bcafc44313daf5dc',
      },
    },
  });
  console.log("TEEEST");
  try {
    const url = new URL(domain)
    const gatewayBaseURL = (await chromeStorageSyncGet(StorageSyncKey.GatewayBaseURL)) ||
      'https://{ipfs}.ipfs.infura-ipfs.io';
    let hash = await resolution.ipfsHash(url.hostname);
    if (isConvertableToV1base32Hash(hash, gatewayBaseURL)) {
      hash = new ipfsClient.CID(hash).toV1(); // convert to V1 base32 ipfs hash
    }
    const baseurl = placeIpfs(hash, gatewayBaseURL);
    const displayUrl = `${baseurl}/${url.pathname}`;
    return chrome.tabs.update(tabId, {
      url: displayUrl,
    })
  } catch (err) {
    let message = err.message
    if (err instanceof ResolutionError) {
      const url = new URL(domain)
      if (err.code === ResolutionErrorCode.RecordNotFound) {
        const redirectUrl = await resolution
          .httpUrl(url.hostname)
          .catch(error => undefined)
        if (redirectUrl) {
          return chrome.tabs.update(tabId, { url: redirectUrl });
        }
        return chrome.tabs.update(tabId, {
          url: `https://unstoppabledomains.com/search?searchTerm=${url.hostname}&searchRef=chrome-extension`,
        });
      }
      if (err.code === ResolutionErrorCode.UnregisteredDomain) {
        return chrome.tabs.update(tabId, {
          url: `https://unstoppabledomains.com/search?searchTerm=${url.hostname}&searchRef=chrome-extension`,
        });
      }
    }
    else {
      return chrome.tabs.update(tabId, { url: `index.html#error?reason=${message}` })
    }
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
