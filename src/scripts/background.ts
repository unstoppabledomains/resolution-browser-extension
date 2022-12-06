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

chrome.declarativeNetRequest.updateDynamicRules(
  {
    addRules: [
      {
        id: 1001,
        priority: 1,
        action: {type: 'block'},
        condition: {
          urlFilter: 'google.com',
          resourceTypes: ['main_frame'],
        },
      },
    ],
    removeRuleIds: [1001],
  },
  console.log.bind(null, 'reachhhhhhhhh'),
)

supportedDomains.forEach((domain, index) => {
  const id = index + 1001

  chrome.declarativeNetRequest.updateDynamicRules(
    {
      addRules: [
        {
          id: id,
          priority: 1,
          action: {type: 'block'},
          condition: {
            urlFilter: domain,
            resourceTypes: ['main_frame'],
          },
        },
      ],
      removeRuleIds: [id],
    },
    console.log.bind(null, `add rule ${id}`),
  )
})
