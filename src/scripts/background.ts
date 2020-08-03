import '../subscripts/onInstalled'
import isValidDNSHostname from '../util/isValidDNSHostname'
import {redirectToIpfs} from '../util/helpers'

const supportedDomains: string[] = [
  '.eth',
  '.crypto',
  '.zil'
]

const searchEngines: string[] = [
  '*://*.google.com/*',
  '*://*.duckduckgo.com/*',
  '*://*.bing.com/*'
]

const supportedDomain = (q: string): boolean => supportedDomains.some((d: string): boolean => q.endsWith(d))

chrome.webRequest.onBeforeRequest.addListener(
  requestDetails => {
    const url = new URL(requestDetails.url)
    const params = url.searchParams
      .get('q')
      .trim()
      .toLowerCase()
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
    urls: searchEngines,
    types: ['main_frame'],
  },
  ['blocking'],
)

chrome.webRequest.onBeforeRequest.addListener(
  requestDetails => {
    chrome.tabs.update(
      {url: 'index.html#loading'},
      async (tab: chrome.tabs.Tab) => {
        await redirectToIpfs(requestDetails.url)
        return {cancel: true}
      },
    )
  },
  {
    urls: supportedDomains.map((d: string): string => `*://*${d}/*`),
    types: ['main_frame'],
  },
  ['blocking'],
)
