import {Logger} from "../logger";
import config from "@unstoppabledomains/config";
import {ResolutionData, SHERLOCK_ICON, UD_PLACEHOLDER_ID} from "./types";
import {TokenType, getSortedTokens} from "@unstoppabledomains/ui-components";
import numeral from "numeral";
import {createElementFromHtml, isStyleInjected} from "./styles";

// working state variables
const zQueue: Record<string, any>[] = [];
let insertId = 0;

// createPopup generates a popup to be injected onto a page
export const createPopup = (r: ResolutionData) => {
  // create the container element
  const baseId = `ud-${r.domain}-${r.address}-${insertId}`;
  const container = document.createElement("div");
  container.id = `${baseId}-container`;
  container.className = "ud-toolTipTrigger";

  // create the main tooltip container
  const toolTipContainer = document.createElement("div");
  toolTipContainer.id = `${baseId}-tooltip`;
  toolTipContainer.className = "ud-toolTipContainer";
  container.appendChild(toolTipContainer);

  // helper method to show the tooltip when it gains focus
  const handleShowToolTip = (e: MouseEvent) => {
    patchParentZ(e, toolTipContainer);
  };

  // helper methods to hide the tooltip when it loses focus
  let hideTimeout: NodeJS.Timeout;
  const handleToolTipLeave = () => {
    hideTimeout = setTimeout(() => restoreParentZ(toolTipContainer), 250);
  };
  const cancelToolTipLeave = () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }
  };

  // create the link that will trigger tooltip to be visible
  const link = document.createElement("a");
  link.id = `${baseId}-link`;
  link.className = "ud-icon";
  link.textContent = SHERLOCK_ICON;
  link.href = "#";
  container.appendChild(link);

  // register tooltip show / hide handlers
  link.onmouseenter = handleShowToolTip;
  toolTipContainer.onmouseenter = cancelToolTipLeave;
  toolTipContainer.onmouseleave = handleToolTipLeave;
  link.onmouseleave = handleToolTipLeave;

  // create tooltip if style was injected
  if (!isStyleInjected()) {
    return;
  }

  // add domain title container
  const nameContainer = document.createElement("div");
  nameContainer.id = `${baseId}-domainName`;
  nameContainer.className = "ud-contentContainer";
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

  // add container for onchain data
  const onchainDiv = document.createElement("div");
  onchainDiv.className = "ud-onchainContainer";
  onchainDiv.appendChild(getSpinner());
  toolTipContainer.appendChild(onchainDiv);

  // add container for links
  const linkContainer = document.createElement("div");
  linkContainer.className = "ud-linkContainer";
  toolTipContainer.appendChild(linkContainer);

  // add button to view profile page
  const profileLink = document.createElement("a");
  profileLink.textContent = "View profile";
  profileLink.className = "ud-link";
  profileLink.style.marginRight = "8px";
  profileLink.href = `${config.UD_ME_BASE_URL}/${r.domain}`;
  profileLink.target = "_blank";
  linkContainer.appendChild(profileLink);

  // add button to copy address
  const copyAddressLink = document.createElement("span");
  copyAddressLink.onclick = () => {
    copyAddressLink.textContent = "Copied";
    copyAddressLink.className = "ud-link ud-link-success";
    copyToClipboard(r.address);
    setTimeout(() => {
      copyAddressLink.textContent = `Copy address`;
      copyAddressLink.className = "ud-link";
    }, 1000);
  };
  copyAddressLink.textContent = `Copy address`;
  copyAddressLink.className = "ud-link";
  linkContainer.appendChild(copyAddressLink);

  // register the tooltip for visibility
  onVisible(nameContainer, async () => {
    try {
      // load the domain profile data when card is shown
      const profileData = await window.unstoppable.getDomainProfile(r.domain);
      if (!profileData?.profile) {
        onchainDiv.textContent = "Onchain data not found";
        return;
      }

      // clear loading content
      onchainDiv.textContent = "";

      // update the card with portfolio data
      if (profileData?.walletBalances) {
        // calculate the USD value of portfolio
        const valueUsd = `$${numeral(
          profileData.walletBalances
            // crypto portfolio value
            .map((w) => w.totalValueUsdAmt || 0)
            .reduce((a, b) => a + b, 0) +
            // domain portfolio value
            (profileData.portfolio?.account?.valueAmt || 0) / 100,
        )
          .format("0.00a")
          .replaceAll(".00", "")}`;

        // update the card with collection data
        const sortedTokens = getSortedTokens(profileData.walletBalances);

        // test create portfolio
        const isEns = r.domain.toLowerCase().endsWith(".eth");
        onchainDiv.appendChild(
          createElementFromHtml(`
            <div class="ud-contentContainer">
                Portfolio:&nbsp;<a class="ud-data-link" href="${sortedTokens.find((t) => t.symbol === (isEns ? "ETH" : "MATIC"))?.walletBlockChainLink}" target="_blank">${valueUsd}</a>
            </div>`),
        );

        const tokenInfo = sortedTokens
          .slice(0, 5)
          .filter((t) => t?.name && t.balance > 0)
          .map(
            (t) =>
              `${t.name} (<a class="ud-data-link" href="${t.walletBlockChainLink}" target="_blank">${numeral(t.balance).format("0.00a").replaceAll(".00", "")} ${t.type === TokenType.Nft ? "NFTs" : t.ticker}</a>)`,
          )
          .join(", ");
        onchainDiv.appendChild(
          createElementFromHtml(`
            <div class="ud-collection">
              ${tokenInfo}
            </div>`),
        );
      }
    } catch (e) {
      Logger.warn("unable to load domain profile", e);
      onchainDiv.textContent = "Error loading onchain data";
    }
  });

  // return the link with tooltip
  insertId++;
  return container;
};

const copyToClipboard = async (v: string) => {
  try {
    await navigator.clipboard.writeText(v);
  } catch (e) {
    console.warn("error copying to clipboard: ", e);
  }
};

const getSpinner = () => {
  return createElementFromHtml(`
    <div class="ud-centered">
      <div class="ud-ellipsis">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>`);
};

const onVisible = (
  element: HTMLElement,
  callback: (e: HTMLElement) => void,
) => {
  new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.intersectionRatio > 0) {
        callback(element);
        observer.disconnect();
      }
    });
  }).observe(element);
  if (!callback) return new Promise((r) => (callback = r));
};

const patchParentZ = (e: MouseEvent, toolTip: HTMLElement) => {
  // retrieve the placeholder div
  const placeHolder = document.getElementById(UD_PLACEHOLDER_ID);
  if (!placeHolder) {
    return;
  }

  // remember the original parent before moving to placeholder
  zQueue.push({parent: toolTip.parentNode});

  // choose default coordinates
  const defaultX = e.pageX + 5;
  const defaultY = e.pageY + 5;

  // update the element location and set display value
  placeHolder.style.left = `${defaultX}px`;
  placeHolder.style.top = `${defaultY}px`;
  toolTip.style.display = "flex";

  // calculate adjusted coordinates if not in screen
  const boxSize = toolTip.getBoundingClientRect();
  const offSetX = Math.min(
    0,
    window.innerWidth - (e.clientX + 5 + boxSize.width),
  );
  const offSetY = Math.min(
    0,
    window.innerHeight - (e.clientY + 5 + boxSize.height),
  );

  // apply adjustments to ensure the box is fully visible
  placeHolder.style.left = `${Math.max(0, defaultX + offSetX)}px`;
  placeHolder.style.top = `${Math.max(0, defaultY + offSetY)}px`;

  // move the node to the placeholder
  placeHolder.appendChild(toolTip);
};

const restoreParentZ = (toolTip: HTMLElement) => {
  // retrieve the original parent state if available
  const originalState = zQueue.shift();
  if (!originalState?.parent) {
    return;
  }

  // hide the tooltip
  toolTip.style.display = "none";

  // restore original parent node
  const parentNode = originalState.parent;
  parentNode.appendChild(toolTip);
};
