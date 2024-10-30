import {isDomainValidForManagement} from "@unstoppabledomains/ui-components";

import {Logger} from "../logger";
import {fromPartialAddress, isEthAddress, isPartialAddress} from "./matcher";
import {createPopup} from "./popup";
import {initializeForPopup} from "./styles";
import {
  BASE_Z_INDEX,
  ResolutionData,
  ResolutionMatch,
  SHERLOCK_ICON,
} from "./types";

// deduplicate multiple requests to scan for addresses
let scanTimer: NodeJS.Timeout | null = null;
let isScanning = false;

// scanForResolutions makes a request to scan document for address data
export const scanForResolutions = () => {
  // bump timer forward if already set
  if (scanTimer) {
    clearTimeout(scanTimer);
  }

  // scan in a few moments
  scanTimer = setTimeout(scan, 500);
};

// resolve wraps the call to resolution API and adds caching
const resolve = async (
  addressOrName: string,
): Promise<ResolutionData | undefined> => {
  // validate the address or name
  if (
    !addressOrName &&
    !isEthAddress(addressOrName) &&
    !isDomainValidForManagement(addressOrName)
  ) {
    return;
  }

  try {
    // resolve the name and return if found
    const resolvedValue = await window.unstoppable.getResolution(addressOrName);
    if (resolvedValue?.address && resolvedValue?.domain) {
      return resolvedValue;
    }
  } catch (e) {
    Logger.warn("error resolving address", e, addressOrName);
  }
  return undefined;
};

// scan the document for address data
const scan = async () => {
  // check for existing scan and ignore if a scan is already
  // currently in progress
  if (isScanning) {
    scanForResolutions();
    return;
  }

  // set a flag to indicate scanning is started
  isScanning = true;

  // maintain a list of matching addresses
  const resolutionMatches: ResolutionMatch[] = [];

  // recursive helper to scan children
  const scanChildren = (childNodes: NodeListOf<ChildNode>) => {
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let j = 0; j < childNodes.length; j++) {
      // handle text nodes (type 3 in the spec)
      const node = childNodes[j];
      if (node.nodeType === 3) {
        // scan each word of the rendered text for matching addresses
        const renderedText = node.nodeValue || "";
        const renderedTextWord = renderedText.split(/[\s]+/);
        for (const maybeAddressOrName of renderedTextWord) {
          // check for ETH address exact matches
          if (isEthAddress(maybeAddressOrName)) {
            // add to the list for processing
            resolutionMatches.push({
              node,
              addressOrName: maybeAddressOrName,
              searchTerm: maybeAddressOrName,
            });
            break;
          }
          // check for ETH address partial matches
          else if (isPartialAddress(maybeAddressOrName)) {
            // attempt to inspect the document for an expanded form of
            // the partial address match
            const address = fromPartialAddress(
              maybeAddressOrName,
              document.body.innerHTML,
            );
            if (address) {
              // add the full address to the list for processing
              resolutionMatches.push({
                node,
                addressOrName: address,
                searchTerm: maybeAddressOrName,
              });
            }
            break;
          }
          // check for domain-like text that ends in a supported TLD
          else if (
            isDomainValidForManagement(maybeAddressOrName.toLowerCase())
          ) {
            resolutionMatches.push({
              node,
              addressOrName: maybeAddressOrName,
              searchTerm: maybeAddressOrName,
            });
            break;
          }
        }

        // search children if present
        if (node.childNodes && node.childNodes.length > 0) {
          scanChildren(node.childNodes);
        }
      }
    }
  };

  // scan the document for addresses
  const domElements = document.body.getElementsByTagName("*");
  // eslint-disable-next-line @typescript-eslint/prefer-for-of
  for (let i = 0; i < domElements.length; i++) {
    scanChildren(domElements[i].childNodes);
  }

  // inject styles if matches found
  if (resolutionMatches.length > 0) {
    initializeForPopup();
  }

  // process matching addresses
  for (const r of resolutionMatches) {
    // determine whether the address can be resolved to a name
    const resolvedData = await resolve(r.addressOrName);

    // inject into DOM if resolution found
    if (resolvedData?.address && resolvedData?.domain) {
      // check to see whether the current match has already been involved with a
      // domain and address injection
      if (
        // parent already contains the injected icon
        isMatchingTrigger(r.node.parentNode, resolvedData) ||
        // grandparent already contains the injected icon
        isMatchingTrigger(r.node.parentNode?.parentNode, resolvedData) ||
        // grandparent already contains the expected domain and
        // formatted address
        isMatchingContent(r.node.parentNode?.parentNode, resolvedData) ||
        // already in a popup
        isInPopup(r.node.parentElement)
      ) {
        // already handled this injection
        continue;
      }

      // remove any existing sherlock siblings, which is necessary if an existing
      // sherlock icon is being replaced by a new resolution match. For example, a
      // react state update may cause a new domain to be displayed in the same DOM
      // location and the associated popup needs to be changed.
      removeSherlockSiblings(r.node.parentElement);

      // if the child node contains a block of text, update the text inline
      // so that the name appears with the address
      if (
        !isEthAddress(r.node.textContent || "") &&
        !isPartialAddress(r.node.textContent || "")
      ) {
        // split the text on the search parameter
        const textContentParts = r.node.textContent?.split(r.searchTerm);
        if (
          // if we find exactly two parts divided by the search parameter
          textContentParts &&
          textContentParts.length === 2 &&
          // this approach cannot be used when child nodes are present, and
          // only works on a single body of text
          !r.node.hasChildNodes()
        ) {
          // create a new div to wrap all the new text elements
          const matchContainer = document.createElement("div");
          matchContainer.style.zIndex = String(BASE_Z_INDEX);

          // create the link for resolved name
          const popup = createPopup(resolvedData);
          if (popup && r.node.parentNode) {
            matchContainer.appendChild(popup);

            // insert the new div just before the matching node
            r.node.parentNode.insertBefore(matchContainer, r.node);

            // insert the current node into the div
            popup.before(r.node);
          }
          continue;
        }
      }

      // if the child contains only the address, insert a new DOM anchor element
      // that links to the domain profile page
      const popup = createPopup(resolvedData);
      if (popup) {
        // update the text content and insert the new link
        r.node.after(popup);
      }
    }
  }

  // scan complete
  isScanning = false;
};

const isMatchingTrigger = (
  node: ParentNode | null | undefined,
  resolution: ResolutionData,
): boolean => {
  // if the sherlock icon is not found there is no match
  if (!node?.textContent?.toLowerCase().includes(SHERLOCK_ICON)) {
    return false;
  }

  // check the ID related to the sherlock icon to ensure it matches
  // the expected resolution
  // eslint-disable-next-line @typescript-eslint/prefer-for-of
  for (let i = 0; i < node.children.length; i++) {
    const childId = node.children[i].id.toLowerCase();
    if (childId.includes(resolution.address.toLowerCase())) {
      return true;
    }
  }

  // no matches found
  return false;
};

const isMatchingContent = (
  node: ParentNode | null | undefined,
  resolution: ResolutionData,
): boolean => {
  const isMatching =
    node?.textContent
      ?.toLowerCase()
      .includes(resolution.domain.toLowerCase()) &&
    (node?.textContent
      .toLowerCase()
      .includes(resolution.address.toLowerCase()) ||
      node?.parentNode?.textContent
        ?.toLowerCase()
        .includes(resolution.address.toLowerCase()));
  return isMatching || false;
};

const isInPopup = (e: Element | null): boolean => {
  // check class name and ID tags of current node
  if (e?.className.startsWith("ud-") && e.id.startsWith("ud-")) {
    return true;
  }

  // check parent if exists
  if (e?.parentElement) {
    return isInPopup(e.parentElement);
  }

  // otherwise not in popup
  return false;
};

const removeSherlockSiblings = (node: Element | null) => {
  if (node?.children) {
    for (let i = node.children.length - 1; i >= 0; i--) {
      const child = node.children[i];
      if (child.id?.startsWith("ud-")) {
        child.remove();
      }
    }
  }
};
