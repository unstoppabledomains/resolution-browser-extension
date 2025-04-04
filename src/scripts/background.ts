import {ContextMenu} from "../lib/sherlock/contextMenu";
import {waitForSessionLock} from "../lib/wallet/session/locker";
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
 * Session lock listener
 ********************************** */
void waitForSessionLock();
