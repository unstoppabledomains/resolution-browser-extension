import {Logger} from "../logger";
import config from "@unstoppabledomains/config";
import {ResolutionData, BASE_Z_INDEX, SHERLOCK_ICON} from "./types";
import {TokenType, getSortedTokens} from "@unstoppabledomains/ui-components";
import numeral from "numeral";
import {isStyleInjected} from "./styles";

// working state variables
const zQueue: Record<string, any>[] = [];
let insertId = 0;

// createPopup generates a popup to be injected onto a page
export const createPopup = (r: ResolutionData) => {
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
  if (!isStyleInjected()) {
    return;
  }

  // create a tooltip container
  const toolTipContainer = document.createElement("div");
  toolTipContainer.id = `${baseId}-tooltip`;
  toolTipContainer.className = "ud-toolTipContainer";
  toolTipContainer.onmouseenter = () => patchParentZ(container);
  toolTipContainer.onmouseleave = () => restoreParentZ(container);
  container.appendChild(toolTipContainer);

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
  const copyAddressLink = document.createElement("a");
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
  copyAddressLink.href = "#";
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
            (profileData.portfolio?.account?.valueAmt || 0),
        )
          .format("0.0a")
          .replaceAll(".0", "")}`;

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
              `${t.name} (<a class="ud-data-link" href="${t.walletBlockChainLink}" target="_blank">${numeral(t.balance).format("0.0a").replaceAll(".0", "")} ${t.type === TokenType.Nft ? "NFTs" : t.ticker}</a>)`,
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

const createElementFromHtml = (html: string) => {
  const template = document.createElement("template");
  template.innerHTML = html;
  return template.content;
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
