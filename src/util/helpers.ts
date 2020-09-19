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

function placeIpfs(subdomainHash: string, url: string): string {
  const regexPatern = /{ipfs}/gi;
  return url.replace(regexPatern, subdomainHash);
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
  });

  try {
    const url = new URL(domain)
    const ipfsHashPromise = resolution.ipfsHash(url.hostname)
    const gatewayBaseURL = (await chromeStorageSyncGet(StorageSyncKey.GatewayBaseURL)) ||
      'https://{ipfs}.infura-ipfs.io';

    let subdomain = await ipfsHashPromise;
    if (subdomain.length == 46 && subdomain.startsWith("Qm")) {
      subdomain = new ipfsClient.CID(subdomain).toV1(); // convert to V1 base32 ipfs hash
    }
    const baseurl = placeIpfs(subdomain, gatewayBaseURL);
    const displayUrl = `${baseurl}/${url.pathname}`;
    console.log(displayUrl);
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
        chrome.tabs.update({ url: redirectUrl })
      }
    }
    else chrome.tabs.update({ url: `index.html#error?reason=${message}` })
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
