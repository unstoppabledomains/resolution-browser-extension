import {ContextMenu} from "../lib/sherlock/contextMenu";
import {waitForXmtpMessages} from "../lib/xmtp/listener";
import "../subscripts/onInstalled";
import {
  backgroundEventListener,
  tabChangeEventListener as tabActivatedEventListener,
  tabCreatedEventListener,
  tabUpdatedEventListener,
} from "./liteWalletProvider/background";
import {waitForSupportedDomains} from "./resolver/background";

/** *********************************
 * IPFS resolver management
 ********************************** */
void waitForSupportedDomains();

/** *********************************
 * Wallet extension popup management
 ********************************** */

// register the wallet popup event listener
chrome.runtime.onMessage.addListener(backgroundEventListener);
chrome.tabs.onActivated.addListener(tabActivatedEventListener);
chrome.tabs.onCreated.addListener(tabCreatedEventListener);
chrome.tabs.onUpdated.addListener(tabUpdatedEventListener);

/** *********************************
 * Context menu and tab management
 ********************************** */
const contextMenu = new ContextMenu();
void contextMenu.waitForEvents();

/** *********************************
 * XMTP listener
 ********************************** */
void waitForXmtpMessages();
