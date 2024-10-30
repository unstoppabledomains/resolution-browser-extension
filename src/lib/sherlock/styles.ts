import {
  BASE_Z_INDEX,
  TOOLTIP_WIDTH,
  UD_PLACEHOLDER_ID,
  UD_STYLE_ID,
} from "./types";

// color pallette
const PRIMARY = "#1976d2";
const SECONDARY = "#42a5f5";
const LIGHT_GREY = "#eeeeee";
const DARK_GREY = "#666666";
const SUCCESS = "#2e7d32";

export const initializeForPopup = () => {
  // get the body element
  const body = document.body || document.getElementsByTagName("body")[0];
  if (!body) {
    return;
  }

  // get the head element
  const head = document.head || document.getElementsByTagName("head")[0];
  if (!head) {
    return;
  }

  // only inject the styles once
  if (isStyleInjected()) {
    return;
  }

  // insert a placeholder div
  body.firstChild?.before(
    createElementFromHtml(`
      <div class="ud-anchor">
        <div id=${UD_PLACEHOLDER_ID} class="ud-placeHolder" />
      </div>
    `),
  );

  // create style element
  const style = document.createElement("style");
  style.id = UD_STYLE_ID;
  style.type = "text/css";

  // create tooltip style definition
  const css = `
    /* styles for Unstoppable Domains extension popup */
    .ud-anchor {
      position: relative;
      z-index: ${BASE_Z_INDEX + 1};
    }

    .ud-placeHolder {
      position: absolute; 
    }

    .ud-toolTipTrigger {
      display: inline-block;
      z-index: ${BASE_Z_INDEX};
      position: relative;
    }
    
    .ud-toolTipContainer {
      display: none;
      background-color: white;
      border: 1px solid ${LIGHT_GREY};
      box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
      color: black; 
      text-align: left;
      justify-content: left;
      padding: 8px;
      border-radius: 6px;
      z-index: ${BASE_Z_INDEX};
      font-family: sans-serif;
      font-size: 14px;
      font-weight: normal;
      line-height: 1.5;
      flex-direction: column;
      cursor: default;
      width: ${TOOLTIP_WIDTH}px;
      white-space: nowrap;
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

    .ud-centered {
      display: flex;
      width: 100%;
      justify-content: center;
      text-align: center;
    }
  
    .ud-collection { 
      font-size: 11px;
      margin-bottom: 4px;
      white-space: normal;
      width: 100%;
    }
  
    .ud-contentContainer {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
    }

    .ud-data-link {
      color: ${PRIMARY};
      font-weight: bold;
      text-decoration: none;
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
      background-color: ${PRIMARY};
      border-radius: 6px;
      color: white;
      cursor: pointer;
      font-weight: bold;
      padding: 8px 20px;
      text-decoration: none;
      width: 50%;
      justify-content: center;
      text-align: center;
    }
    
    .ud-link-success {
      background-color: ${SUCCESS};
    }
    
    .ud-onchainContainer {
      color: ${DARK_GREY};
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 80px;
      width: 100%;
    }

    /* Styles for loading spinner */
    .ud-ellipsis {
        color: ${SECONDARY};
    }
    .ud-ellipsis,
    .ud-ellipsis div {
        box-sizing: border-box;
    }
    .ud-ellipsis {
        display: inline-block;
        position: relative;
        width: 80px;
        height: 80px;
    }
    .ud-ellipsis div {
        position: absolute;
        top: 33.33333px;
        width: 13.33333px;
        height: 13.33333px;
        border-radius: 50%;
        background: currentColor;
        animation-timing-function: cubic-bezier(0, 1, 1, 0);
    }
    .ud-ellipsis div:nth-child(1) {
        left: 8px;
        animation: ud-ellipsis1 0.6s infinite;
    }
    .ud-ellipsis div:nth-child(2) {
        left: 8px;
        animation: ud-ellipsis2 0.6s infinite;
    }
    .ud-ellipsis div:nth-child(3) {
        left: 32px;
        animation: ud-ellipsis2 0.6s infinite;
    }
    .ud-ellipsis div:nth-child(4) {
        left: 56px;
        animation: ud-ellipsis3 0.6s infinite;
    }
    @keyframes ud-ellipsis1 {
        0% {
            transform: scale(0);
        }
        100% {
            transform: scale(1);
        }
    }
    @keyframes ud-ellipsis3 {
        0% {
            transform: scale(1);
        }
        100% {
            transform: scale(0);
        }
    }
    @keyframes ud-ellipsis2 {
        0% {
            transform: translate(0, 0);
        }
        100% {
            transform: translate(24px, 0);
        }
    }
  `;

  // add styles to the head element
  style.appendChild(document.createTextNode(css));
  head.appendChild(style);
};

export const isStyleInjected = () => {
  const head = document.head || document.getElementsByTagName("head")[0];
  if (!head) {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/prefer-for-of
  for (let i = 0; i < head.children.length; i++) {
    if (head.children[i].id === UD_STYLE_ID) {
      return true;
    }
  }
  return false;
};

export const createElementFromHtml = (html: string) => {
  const template = document.createElement("template");
  template.innerHTML = html;
  return template.content;
};
