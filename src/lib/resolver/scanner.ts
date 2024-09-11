import {
  getStrictReverseResolution,
  isEthAddress,
} from "@unstoppabledomains/ui-components";
import config from "@unstoppabledomains/config";
import {fromPartialAddress, isPartialAddress} from "./matcher";
import {Logger} from "../logger";
import Bluebird from "bluebird";
import {AUGMENT_ID_PREFIX, AddressMatch} from "./types";
import {LRUCache} from "lru-cache";

// deduplicate multiple requests to scan for addresses
let scanTimer: NodeJS.Timeout = null;

// remember up to 500 resolution results to avoid duplicating
// lookups for the same address
const resolutionCache = new LRUCache<string, string>({
  max: 500,
});

// scanForAddresses makes a request to scan document for address data
export const scanForAddresses = () => {
  // bump timer forward if already set
  if (scanTimer) {
    clearTimeout(scanTimer);
  }

  // scan in a few moments
  scanTimer = setTimeout(scan, 500);
};

// resolveName wraps the call to resolution API and adds caching
const resolveName = async (address: string): Promise<string | undefined> => {
  try {
    // get from cache if possible
    const cachedName = resolutionCache.get(address.toLowerCase());
    if (cachedName) {
      if (cachedName !== address.toLowerCase()) {
        return cachedName;
      }
      return undefined;
    }

    // resolve the name and return if found
    const resolvedName = await getStrictReverseResolution(address);
    if (resolvedName) {
      resolutionCache.set(address.toLowerCase(), resolvedName);
      return resolvedName;
    }

    // store the negative result to prevent further lookups
    resolutionCache.set(address.toLowerCase(), address.toLowerCase());
  } catch (e) {
    Logger.warn("error resolving address", e, address);
  }
  return undefined;
};

// scan the document for address data
const scan = async () => {
  // maintain a list of matching addresses
  const addressMatches: AddressMatch[] = [];

  // scan the document for addresses
  const domElements = document.getElementsByTagName("*");
  for (var i = 0; i < domElements.length; i++) {
    const childNodes = domElements[i].childNodes;
    for (var j = 0; j < childNodes.length; j++) {
      if (childNodes[j].nodeType === 3) {
        // extract rendered text
        const renderedText = childNodes[j].nodeValue;

        // check for ETH address exact matches
        if (isEthAddress(renderedText)) {
          // add to the list for processing
          addressMatches.push({
            node: childNodes[j],
            address: renderedText,
            renderedText,
          });
        }
        // check for ETH address partial matches
        else if (isPartialAddress(renderedText)) {
          // attempt to inspect the document for an expanded form of
          // the partial address match
          const address = fromPartialAddress(
            renderedText,
            document.body.innerHTML,
          );
          if (address) {
            // add the full address to the list for processing
            addressMatches.push({
              node: childNodes[j],
              address,
              renderedText,
            });
          }
        }
      }
    }
  }

  // process the matching addresses concurrently
  await Bluebird.map(
    addressMatches,
    async (addressMatch) => {
      // see if node is already processed
      for (let i = 0; i < addressMatch.node.parentNode.children.length; i++) {
        if (
          addressMatch.node.parentNode.children[i].id?.startsWith(
            AUGMENT_ID_PREFIX,
          )
        ) {
          return;
        }
      }

      // process the address
      const resolvedName = await resolveName(addressMatch.address);
      if (resolvedName) {
        // create a link to the resolved name
        const augmentNode = document.createElement("a");
        augmentNode.id = `${AUGMENT_ID_PREFIX}${addressMatch.address}`;
        augmentNode.style.marginLeft = "4px";
        augmentNode.style.fontWeight = "bold";
        augmentNode.textContent = `(${resolvedName})`;
        augmentNode.href = `${config.UD_ME_BASE_URL}/${resolvedName}`;
        augmentNode.target = "_blank";

        // augment the page with the resolved name
        addressMatch.node.parentNode.appendChild(augmentNode);
      }
    },
    {concurrency: 3},
  );
};
