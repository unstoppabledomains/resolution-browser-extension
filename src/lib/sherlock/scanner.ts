import {fromPartialAddress, isEthAddress, isPartialAddress} from "./matcher";
import {Logger} from "../logger";
import config from "@unstoppabledomains/config";
import {ResolutionMatch, ResolutionData} from "./types";
import {
  isDomainValidForManagement,
  getBlockScanUrl,
} from "@unstoppabledomains/ui-components";

// runtime constants
const SHERLOCK_ICON = "🔍";
const UD_STYLE_ID = "ud-styles";
const BASE_Z_INDEX = 10000;

// working state variables
const zQueue: Record<string, any>[] = [];
let insertId = 0;

// deduplicate multiple requests to scan for addresses
let scanTimer: NodeJS.Timeout = null;

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
  // maintain a list of matching addresses
  const resolutionMatches: ResolutionMatch[] = [];

  // recursive helper to scan children
  const scanChildren = (childNodes: NodeListOf<ChildNode>) => {
    for (var j = 0; j < childNodes.length; j++) {
      // handle text nodes (type 3 in the spec)
      const node = childNodes[j];
      if (node.nodeType === 3) {
        // scan each word of the rendered text for matching addresses
        const renderedText = node.nodeValue;
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
  for (var i = 0; i < domElements.length; i++) {
    scanChildren(domElements[i].childNodes);
  }

  // inject styles if matches found
  if (resolutionMatches.length > 0) {
    injectStyles();
  }

  // process matching addresses
  for (const r of resolutionMatches) {
    // determine whether the address can be resolved to a name
    const resolvedData = await resolve(r.addressOrName);

    // inject into DOM if resolution found
    if (resolvedData?.address && resolvedData?.domain) {
      // parent container to validate content
      const parentContainer = r.node.parentNode?.parentNode;

      // check to see whether the current match has already been involved with a
      // domain and address injection
      if (
        // already contains the injected icon
        parentContainer?.textContent?.toLowerCase().includes(SHERLOCK_ICON) ||
        // already contains the domain and formatted address
        (parentContainer?.textContent
          .toLowerCase()
          .includes(resolvedData.domain.toLowerCase()) &&
          (parentContainer?.textContent
            .toLowerCase()
            .includes(resolvedData.address.toLowerCase()) ||
            parentContainer?.parentNode?.textContent
              .toLowerCase()
              .includes(resolvedData.address.toLowerCase())))
      ) {
        // already handled this injection
        continue;
      }

      // if the child node contains a block of text, update the text inline
      // so that the name appears with the address
      if (
        !isEthAddress(r.node.textContent) &&
        !isPartialAddress(r.node.textContent)
      ) {
        // split the text on the search parameter
        const textContentParts = r.node.textContent.split(r.searchTerm);
        if (
          // if we find exactly two parts divided by the search parameter
          textContentParts.length === 2 &&
          // this approach cannot be used when child nodes are present, and
          // only works on a single body of text
          !r.node.hasChildNodes()
        ) {
          // create a new div to wrap all the new text elements
          const matchContainer = document.createElement("div");
          matchContainer.style.zIndex = String(BASE_Z_INDEX);

          // create the link for resolved name
          const link = createLink(resolvedData);
          matchContainer.appendChild(link);

          // insert the new div just before the matching node
          r.node.parentNode.insertBefore(matchContainer, r.node);

          // insert the current node into the div
          link.before(r.node);
          continue;
        }
      }

      // if the child contains only the address, insert a new DOM anchor element
      // that links to the domain profile page
      const link = createLink(resolvedData);

      // update the text content and insert the new link
      r.node.after(link);
    }
  }
};

// createLink to the profile of a resolved name
const createLink = (r: ResolutionData) => {
  // create the container element
  const container = document.createElement("div");
  container.className = "ud-toolTipTrigger";

  // create the link
  const baseId = `${r.domain}-${r.address}-${insertId}`;
  const link = document.createElement("a");
  link.id = `${baseId}-link`;
  link.className = "ud-icon";
  link.textContent = SHERLOCK_ICON;
  link.href = "#";
  link.onmouseenter = () => patchParentZ(container);
  link.onmouseleave = () => restoreParentZ(container);
  container.appendChild(link);

  // create tooltip if style was injected
  if (isStyleInjected()) {
    // create a tooltip container
    const toolTipContainer = document.createElement("div");
    toolTipContainer.id = `${baseId}-tooltip`;
    toolTipContainer.className = "ud-toolTipContainer";
    toolTipContainer.onmouseenter = () => patchParentZ(container);
    toolTipContainer.onmouseleave = () => restoreParentZ(container);
    container.appendChild(toolTipContainer);

    // add domain title container
    const nameContainer = document.createElement("div");
    nameContainer.className = "ud-domainContainer";
    toolTipContainer.appendChild(nameContainer);

    // add domain avatar
    const nameAvatar = document.createElement("img");
    nameAvatar.className = "ud-avatar";
    nameAvatar.src = r.avatar;
    nameContainer.appendChild(nameAvatar);

    // add domain name
    const nameTxt = document.createElement("div");
    nameTxt.textContent = r.domain;
    nameTxt.className = "ud-domain";
    nameContainer.appendChild(nameTxt);

    // add wallet address
    const addressDiv = document.createElement("div");
    addressDiv.textContent = r.address;
    addressDiv.className = "ud-address";
    toolTipContainer.appendChild(addressDiv);

    // add container for links
    const linkContainer = document.createElement("div");
    linkContainer.className = "ud-linkContainer";
    toolTipContainer.appendChild(linkContainer);

    // add link to the profile page
    const profileLink = document.createElement("a");
    profileLink.textContent = "View profile";
    profileLink.className = "ud-link";
    profileLink.style.marginRight = "8px";
    profileLink.href = `${config.UD_ME_BASE_URL}/${r.domain}`;
    profileLink.target = "_blank";
    linkContainer.appendChild(profileLink);

    // add link to block scanner page
    const isEns = r.domain.toLowerCase().endsWith(".eth");
    const blockScanLink = document.createElement("a");
    blockScanLink.textContent = `View on OKLink`;
    blockScanLink.className = "ud-link";
    blockScanLink.href = getBlockScanUrl(
      (isEns ? "ETH" : "MATIC") as any,
      r.address,
    );
    blockScanLink.target = "_blank";
    linkContainer.appendChild(blockScanLink);
  }

  // return the link with tooltip
  insertId++;
  return container;
};

const injectStyles = () => {
  // get the head and create a style element
  var head = document.head || document.getElementsByTagName("head")[0];
  if (!head) {
    return;
  }

  // only inject the styles once
  if (isStyleInjected()) {
    return;
  }

  // create style element
  var style = document.createElement("style");
  style.id = UD_STYLE_ID;
  style.type = "text/css";

  // create tooltip style definition
  var css = `.ud-toolTipTrigger {
    display: inline-block;
    z-index: ${BASE_Z_INDEX};
    position: relative;
  }
  
  .ud-toolTipTrigger .ud-toolTipContainer {
    visibility: hidden;
    background-color: white;
    border: 1px solid #eeeeee;
    box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
    color: black; 
    text-align: left;
    justify-content: left;
    padding: 8px;
    border-radius: 6px;
    position: absolute;
    z-index: ${BASE_Z_INDEX};
    font-size: 14px;
    font-weight: normal;
    white-space: nowrap;
    display: flex;
    flex-direction: column;
    cursor: default;
  }
  
  .ud-toolTipTrigger:hover .ud-toolTipContainer {
    visibility: visible;
  }

  .ud-address {
    font-family: courier new;
    font-size: 12px;
    margin-bottom: 8px;
  }

  .ud-avatar {
    width: 16px;
    height: 16px;
    margin-right: 8px;
  }

  .ud-domainContainer {
    display: flex;
    align-items: center;
    margin-bottom: 4px;
  }

  .ud-domain {
    font-size: 18px;
    font-weight: bold;
  }

  .ud-icon {
    text-decoration: none;
    margin-left: 4px;
    z-index: ${BASE_Z_INDEX};
  }

  .ud-linkContainer {
    display: flex;
    margin-top: 8px;
    width: 100%;
  }
  
  .ud-link {
    background-color: #1976d2;
    border-radius: 6px;
    color: white;
    cursor: pointer;
    font-weight: bold;
    padding: 8px 20px;
    text-decoration: none;
    width: 50%;
    justify-content: center;
    text-align: center;
  }`;

  // add styles to the head element
  style.appendChild(document.createTextNode(css));
  head.appendChild(style);
};

const isStyleInjected = () => {
  var head = document.head || document.getElementsByTagName("head")[0];
  if (!head) {
    return false;
  }

  for (let i = 0; i < head.children.length; i++) {
    if (head.children[i].id === UD_STYLE_ID) {
      return true;
    }
  }
  return false;
};

const patchParentZ = (node: Node) => {
  if (node?.parentElement?.style) {
    zQueue.push({
      zIndex: node.parentElement.style.zIndex,
      overflow: node.parentElement.style.overflow,
      overflowX: node.parentElement.style.overflowX,
      overflowY: node.parentElement.style.overflowY,
    });
    node.parentElement.style.zIndex = String(BASE_Z_INDEX + 1);
    node.parentElement.style.overflow = "visible";
    node.parentElement.style.overflowX = "visible";
    node.parentElement.style.overflowY = "visible";
    patchParentZ(node.parentNode);
  }
};

const restoreParentZ = (node: Node) => {
  if (node?.parentElement?.style) {
    const originalState = zQueue.shift();
    node.parentElement.style.zIndex = originalState.zIndex;
    node.parentElement.style.overflow = originalState.overflow;
    node.parentElement.style.overflowX = originalState.overflowX;
    node.parentElement.style.overflowY = originalState.overflowY;
    restoreParentZ(node.parentNode);
  }
};
