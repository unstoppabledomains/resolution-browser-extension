import {WalletPreferences} from "../../types/wallet/preferences";
import config from "@unstoppabledomains/config";
import {ProviderEvent, ProviderRequest} from "../../types/wallet/provider";
import {Logger} from "../logger";
import {getConnectedSites, removeConnectedSite} from "../wallet/evm/connection";
import {
  getDefaultPreferences,
  getWalletPreferences,
  setWalletPreferences,
} from "../wallet/preferences";
import {sendMessageToClient} from "../wallet/message";
import {openSidePanel, setIcon} from "../runtime";
import {currentFocussedWindowId} from "../../scripts/liteWalletProvider/background";

const ORIGINS: Record<string, boolean> = {};

enum MenuType {
  Sherlock = "sherlock",
  Connection = "connection",
  SelectedText = "selectedText",
  Messages = "messages",
}

// messageListener wraps a context menu instance and handles message events
const messageListener = (ctx: ContextMenu) => {
  return (message: ProviderRequest) => {
    ctx.handleMessage(message);
  };
};

// menuListener wraps a context menu instance and handles menu events
const menuListener = (ctx: ContextMenu) => {
  return async (info: chrome.contextMenus.OnClickData) => {
    await ctx.handleMenu(info);
  };
};

// ContextMenu manages lifecycle of browser extension context menus and
// handles user interaction with menu options
export class ContextMenu {
  constructor(private preferences?: WalletPreferences) {}

  private clear() {
    chrome.contextMenus.removeAll();
  }

  private createAll(origin: string) {
    // add Sherlock menu item
    chrome.contextMenus.create({
      id: `${MenuType.Sherlock}-${origin}`,
      title: this.getSherlockMenuTitle(origin),
      documentUrlPatterns: [`${origin}/*`],
    });

    // add connection menu item if wallet connected
    this.getConnectionMenuTitle(origin).then((connectionTitle) => {
      if (connectionTitle) {
        chrome.contextMenus.create({
          id: `${MenuType.Connection}-${origin}`,
          title: connectionTitle,
          documentUrlPatterns: [`${origin}/*`],
        });
      }
    });

    // add message menu item
    chrome.contextMenus.create({
      id: `${MenuType.Messages}-${origin}`,
      title: "Open messages",
      documentUrlPatterns: [`${origin}/*`],
    });

    // add selected text menu item
    chrome.contextMenus.create({
      id: `${MenuType.SelectedText}-${origin}`,
      title: "Find domains related to “%s“",
      documentUrlPatterns: [`${origin}/*`],
      contexts: ["selection"],
    });
  }

  private remove(origin: string, menuType: MenuType) {
    chrome.contextMenus.remove(`${menuType}-${origin}`);
  }

  private update(origin: string, menuType: MenuType) {
    chrome.contextMenus.update(`${menuType}-${origin}`, {
      title: this.getSherlockMenuTitle(origin),
    });
  }

  broadcastTab() {
    if (!window?.location?.origin) {
      return;
    }
    document.dispatchEvent(
      new ProviderEvent("newTabRequest", {
        detail: [window.location.origin.toLowerCase()],
      }),
    );
  }

  refreshAll() {
    Object.keys(ORIGINS).map((origin) => {
      this.refreshTab(origin);
    });
  }

  refreshTab(origin: string) {
    try {
      // remove existing context menu item
      if (ORIGINS[origin]) {
        this.remove(origin, MenuType.Connection);
        this.remove(origin, MenuType.Sherlock);
        this.remove(origin, MenuType.SelectedText);
        this.remove(origin, MenuType.Messages);
      }

      // create new context menu item
      this.createAll(origin);
      ORIGINS[origin] = true;
    } catch (e) {
      // gracefully ignore errors
    }
  }

  async handleMessage(message: ProviderRequest) {
    if (message?.type !== "newTabRequest") {
      return;
    }
    if (!message?.params || message.params.length === 0) {
      return;
    }

    // refresh preference data
    this.preferences = await getWalletPreferences();

    // refresh the context menu on specified tab
    const origin = message.params[0].toLowerCase();
    this.refreshTab(origin);
  }

  async handleMenu(info: chrome.contextMenus.OnClickData) {
    // require a menu ID
    if (!info?.menuItemId || typeof info.menuItemId !== "string") {
      return;
    }

    // determine type of menu
    const menuOptions = info.menuItemId.split("-");
    if (menuOptions.length !== 2) {
      return;
    }

    // handle the menu action
    switch (menuOptions[0]) {
      case MenuType.Sherlock:
        await this.handleSherlockMenu(menuOptions[1]);
        break;
      case MenuType.Connection:
        await this.handleDisconnectMenu(menuOptions[1]);
        break;
      case MenuType.Messages:
        await this.handleMessageMenu();
        break;
      case MenuType.SelectedText:
        await this.handleFindDomainMenu(info);
        break;
    }
  }

  /* **********************
   * Messages menu handling
   * **********************/

  async handleMessageMenu() {
    console.log("AJQ opening", currentFocussedWindowId);
    await openSidePanel({windowId: currentFocussedWindowId});
  }

  /* **********************
   * Sherlock menu handling
   * **********************/

  async handleSherlockMenu(origin: string) {
    // retrieve current preferences and initialize if needed
    this.preferences = await getWalletPreferences();
    if (!this.preferences.Scanning?.IgnoreOrigins) {
      const defaultPreferences = getDefaultPreferences();
      this.preferences.Scanning = {
        Enabled: true,
        IgnoreOrigins: defaultPreferences.Scanning.IgnoreOrigins,
      };
    }

    // update current preferences
    if (this.isSherlockDisabled(origin)) {
      // enable sherlock
      const ignoreOrigins = this.preferences.Scanning.IgnoreOrigins.filter(
        (h) => !h.toLowerCase().includes(origin.toLowerCase()),
      );
      this.preferences.Scanning.Enabled = true;
      this.preferences.Scanning.IgnoreOrigins = ignoreOrigins;
    } else {
      // disable sherlock
      this.preferences.Scanning.IgnoreOrigins.push(origin.toLowerCase());
    }

    // update menu and store preferences
    this.update(origin, MenuType.Sherlock);
    await setWalletPreferences(this.preferences);
  }

  isSherlockDisabled(origin: string) {
    return (
      !this.preferences ||
      !this.preferences.Scanning ||
      !this.preferences.Scanning.Enabled ||
      this.preferences.Scanning.IgnoreOrigins?.find((h) =>
        origin.toLowerCase().includes(h.toLowerCase()),
      )
    );
  }

  private getSherlockMenuTitle(origin: string) {
    return this.isSherlockDisabled(origin)
      ? `Enable Sherlock Assistant on this site`
      : `Disable Sherlock Assistant on this site`;
  }

  /* *************************
   * Find domain menu handling
   * *************************/

  async handleFindDomainMenu(info: chrome.contextMenus.OnClickData) {
    chrome.tabs.create({
      url: `${config.UNSTOPPABLE_WEBSITE_URL}/search?searchTerm=${encodeURIComponent(info.selectionText)}&searchRef=extension`,
    });
  }

  /* ************************
   * Connection menu handling
   * ************************/

  async handleDisconnectMenu(origin: string) {
    // remove connection internally
    await removeConnectedSite(new URL(origin).hostname);
    chrome.contextMenus.remove(
      `${MenuType.Connection}-${origin.toLowerCase()}`,
    );

    // remove the connected icon
    await setIcon("default");

    // notify client of disconnection
    await sendMessageToClient("disconnectRequest");
  }

  async waitForEvents() {
    if (chrome?.contextMenus?.onClicked && chrome.runtime) {
      this.clear();
      this.preferences = await getWalletPreferences();

      // listen for messages requesting context menu updates
      chrome.runtime.onMessage.addListener(messageListener(this));

      // listen for context menu clicks
      chrome.contextMenus.onClicked.addListener(menuListener(this));
      Logger.log("Listening for context menu events...");
    } else {
      // wait for the contextMenu permission to be created and
      // try again with the callback
      Logger.log("Waiting for contextMenus permission to be available...");
      chrome.permissions.onAdded.addListener(async (p) => {
        if (p?.permissions?.includes("contextMenus")) {
          await this.waitForEvents();
        }
      });
    }
  }

  async isWalletConnected(origin: string) {
    const allConnections = await getConnectedSites();
    if (!allConnections || Object.keys(allConnections).length === 0) {
      return false;
    }
    return (
      Object.keys(allConnections).filter((connectedHost) => {
        const originHost = new URL(origin.toLowerCase()).hostname;
        Logger.log(
          "Comparing hosts",
          JSON.stringify({originHost, connectedHost}),
        );
        return originHost === connectedHost.toLowerCase();
      }).length > 0
    );
  }

  private async getConnectionMenuTitle(origin: string) {
    const isConnected = await this.isWalletConnected(origin);
    return isConnected ? "Disconnect wallet from this site" : "";
  }
}
