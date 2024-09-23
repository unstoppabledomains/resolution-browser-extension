import {getStrictReverseResolution} from "@unstoppabledomains/ui-components";
import config from "@unstoppabledomains/config";
import {fromPartialAddress, isEthAddress, isPartialAddress} from "./matcher";
import {Logger} from "../logger";
import Bluebird from "bluebird";
import {AUGMENT_ID_PREFIX, AddressMatch} from "./types";
import {LRUCache} from "lru-cache";
import truncateMiddle from "truncate-middle";

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
  // validate the address
  if (!address || !isEthAddress(address)) {
    return;
  }

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
        // scan each word of the rendered text for matching addresses
        const renderedText = childNodes[j].nodeValue;
        const renderedTextWord = renderedText.split(/[\s]+/);
        for (const maybeAddress of renderedTextWord) {
          // check for ETH address exact matches
          if (isEthAddress(maybeAddress)) {
            // add to the list for processing
            addressMatches.push({
              node: childNodes[j],
              address: maybeAddress,
              searchTerm: maybeAddress,
            });
            break;
          }
          // check for ETH address partial matches
          else if (isPartialAddress(maybeAddress)) {
            // attempt to inspect the document for an expanded form of
            // the partial address match
            const address = fromPartialAddress(
              maybeAddress,
              document.body.innerHTML,
            );
            if (address) {
              // add the full address to the list for processing
              addressMatches.push({
                node: childNodes[j],
                address,
                searchTerm: maybeAddress,
              });
            }
            break;
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
          // contains a link with known ID prefix
          addressMatch.node.parentNode.children[i].id?.startsWith(
            AUGMENT_ID_PREFIX,
          ) ||
          // contains the search term in parentheses
          addressMatch.node.parentNode.children[i].textContent
            ?.toLowerCase()
            .includes(`(${addressMatch.searchTerm.toLowerCase()})`)
        ) {
          // node has already been processed, no more work required
          return;
        }
      }

      // determine whether the address can be resolved to a name
      const resolvedName = await resolveName(addressMatch.address);
      if (resolvedName) {
        // if the child node contains a block of text, update the text inline
        // so that the name appears with the address
        if (
          !isEthAddress(addressMatch.node.textContent) &&
          !isPartialAddress(addressMatch.node.textContent)
        ) {
          // split the text on the search parameter
          const textContentParts = addressMatch.node.textContent.split(
            addressMatch.searchTerm,
          );
          if (
            // if we find exactly two parts divided by the search parameter
            textContentParts.length === 2 &&
            // this approach cannot be used when child nodes are present, and
            // only works on a single body of text
            !addressMatch.node.hasChildNodes()
          ) {
            // create a new div to wrap all the new text elements
            const div = document.createElement("div");

            // create a span to contain text before search term
            const s1 = document.createElement("span");
            s1.textContent = `${textContentParts[0]} `;
            div.appendChild(s1);

            // create the link for resolved name
            const link = createLink(resolvedName, addressMatch.address);
            div.appendChild(link);

            // create a span to contain text after the search term
            const s2 = document.createElement("span");
            s2.textContent = ` (${formatAddress(addressMatch.address)}) ${textContentParts[1]}`;
            div.appendChild(s2);

            // insert the new div just before the matching node, and then remove the
            // matching node itself to prevent duplication
            addressMatch.node.parentNode.insertBefore(div, addressMatch.node);
            addressMatch.node.parentNode.removeChild(addressMatch.node);
            return;
          }

          // as a fallback, perform a simple inline replace that will not contain a
          // link to the resolved name
          addressMatch.node.textContent =
            addressMatch.node.textContent.replaceAll(
              addressMatch.searchTerm,
              `${resolvedName} (${formatAddress(addressMatch.address)})`,
            );
          return;
        }

        // if the child contains only the address, insert a new DOM anchor element
        // that links to the domain profile page
        const link = createLink(resolvedName, addressMatch.address);
        link.style.marginRight = "4px";

        // update the text content and insert the new link
        addressMatch.node.textContent = `(${formatAddress(addressMatch.address)})`;
        addressMatch.node.parentNode.insertBefore(link, addressMatch.node);
      }
    },
    {concurrency: 3},
  );
};

// createLink to the profile of a resolved name
const createLink = (resolvedName: string, address: string) => {
  const link = document.createElement("a");
  link.id = `${AUGMENT_ID_PREFIX}${address.toLowerCase()}`;
  link.style.fontWeight = "bold";
  link.textContent = resolvedName;
  link.href = `${config.UD_ME_BASE_URL}/${resolvedName}`;
  link.target = "_blank";
  return link;
};

// formatAddress displays address in truncated form (e.g. 0x1234...5678)
const formatAddress = (address: string) => {
  return truncateMiddle(address, 6, 4, "...");
};
