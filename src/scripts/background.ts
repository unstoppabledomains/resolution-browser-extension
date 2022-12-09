import '../subscripts/onInstalled'
import isValidDNSHostname from '../util/isValidDNSHostname'
import {
  redirectToIpfs,
  supportedDomain,
  supportedDomains,
} from '../util/helpers'
import {searchEngines, SearchEngine} from '../util/searchEngines'
import OAURL from '../util/OsAgnosticURL'
import logger from '../util/logger'

supportedDomains.forEach((domain, index) => {
  const id = index + 1001

  chrome.declarativeNetRequest.updateDynamicRules(
    {
      addRules: [
        {
          id,
          action: {
            type: 'redirect',
            redirect: {
              regexSubstitution:
                'https://resolve.unstoppabledomains.com/domains/\\1',
            },
          },
          condition: {
            regexFilter: `^.*?[?&]q=([^&]*\\${domain}&)`,

            resourceTypes: ['main_frame'],
            requestDomains: ['google.com'],
          },
        },
      ],
      removeRuleIds: [id],
    },
    console.log.bind(null, `add rule ${id}`),
  )
})
