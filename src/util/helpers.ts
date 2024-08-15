import Resolution, {
  ResolutionError,
  ResolutionErrorCode,
} from '@unstoppabledomains/resolution'
import {chromeStorageSyncGet, StorageSyncKey} from './chromeStorageSync'
import ipfsClient from 'ipfs-http-client'
import OAURL from './OsAgnosticURL'
import logger from './logger'

export function invert(object) {
  const returnee = {}

  for (const key in object) {
    if (!object.hasOwnProperty(key)) continue
    returnee[object[key]] = key
  }
  return returnee
}

function placeIpfs(hash: string, url: string): string {
  const regexPatern = /{ipfs}/gi
  return url.replace(regexPatern, hash)
}

function isConvertableToV1base32Hash(hash: string, url: string): boolean {
  const parts = url.split('.')
  if (!parts[0].includes('{ipfs}')) return false
  return hash.length == 46 && hash.startsWith('Qm')
}

export async function redirectToIpfs(domain: string, tabId?: number) {
  const resolution = new Resolution({apiKey: process.env.RESOLUTION_API_KEY})
  const url = new OAURL(domain)
  try {
    const gatewayBaseURL =
      (await chromeStorageSyncGet(StorageSyncKey.GatewayBaseURL)) ||
      'https://{ipfs}.ipfs.infura-ipfs.io'
    logger.log(`resolving domain ${url.hostname()}`)
    let hash = await resolution.ipfsHash(url.hostname())
    logger.log(`resolved ipfs hash = ${hash}`)
    if (isConvertableToV1base32Hash(hash, gatewayBaseURL)) {
      hash = new ipfsClient.CID(hash).toV1() // convert to V1 base32 ipfs hash
    }
    const baseurl = placeIpfs(hash, gatewayBaseURL)
    const displayUrl = `${baseurl}/${
      url.pathname() === '/'
        ? ''
        : url.pathname() /* Trim the extra '/' to avoid Gateway like Infura will resolve to a wrong IPFS URL */
    }`
    logger.log(`redirecting to ${displayUrl}`)
    return chrome.tabs.update(tabId, {
      url: displayUrl,
    })
  } catch (err) {
    logger.log(err)
    let message = err.message
    if (err instanceof ResolutionError) {
      if (err.code === ResolutionErrorCode.RecordNotFound) {
        const redirectUrl = await resolution
          .httpUrl(url.hostname())
          .catch(error => undefined)
        if (redirectUrl) {
          return chrome.tabs.update(tabId, {url: redirectUrl})
        }
        return chrome.tabs.update(tabId, {
          url: `https://unstoppabledomains.com/search?searchTerm=${url.hostname()}&searchRef=chrome-extension`,
        })
      }
      if (err.code === ResolutionErrorCode.UnregisteredDomain) {
        return chrome.tabs.update(tabId, {
          url: `https://unstoppabledomains.com/search?searchTerm=${url.hostname()}&searchRef=chrome-extension`,
        })
      }
    } else {
      return chrome.tabs.update(tabId, {
        url: `index.html#error?reason=${message}`,
      })
    }
  }
}

//domain names supported
export const supportedDomains: string[] = [
  '.crypto',
  '.nft',
  '.wallet',
  '.bitcoin',
  '.x',
  '.888',
  '.dao',
  '.blockchain',
  '.zil',
  '.hi',
  '.klever',
  '.kresus',
  '.polygon',
  '.anime',
  '.manga',
  '.binanceus',
  '.go',
  '.altimist',
  '.pudgy',
  '.austin',
  '.unstoppable',
  '.bitget',
  '.pog',
  '.clay',
  '.witg',
  '.metropolis',
  '.wrkx',
  '.secret',
  '.raiin',
  '.stepn',
  '.kryptic',
  '.ubu',
  '.tball',
  '.farms',
  '.dfz',
]

//return true if url ends in one of the supported domains
export const supportedDomain = (q: string): boolean =>
  supportedDomains.some((d: string): boolean => q.endsWith(d))
