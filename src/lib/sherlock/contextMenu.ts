import {WalletPreferences} from "../../types/wallet/preferences";
import {ProviderEvent, ProviderRequest} from "../../types/wallet/provider";
import {Logger} from "../logger";
import {
  getDefaultPreferences,
  getWalletPreferences,
  setWalletPreferences,
} from "../wallet/preferences";

// tabListener wraps a context menu instance and handles tab events
const tabListener = (ctx: ContextMenu) => {
  return (message: ProviderRequest) => {
    ctx.handleTab(message);
  };
};

// menuListener wraps a context menu instance and handles menu events
const menuListener = (ctx: ContextMenu) => {
  return (info: chrome.contextMenus.OnClickData) => {
    ctx.handleMenu(info);
  };
};

const ORIGINS: Record<string, boolean> = {};

// ContextMenu manages lifecycle of browser extension context menus and
// handles user interaction with menu options
export class ContextMenu {
  constructor(private preferences?: WalletPreferences) {}

  async waitForEvents() {
    if (chrome?.contextMenus && chrome.runtime) {
      this.clear();
      this.preferences = await getWalletPreferences();

      // listen for page requests for context menu updates
      chrome.runtime.onMessage.addListener(tabListener(this));

      // listen for context menu clicks
      chrome.contextMenus.onClicked.addListener(menuListener(this));
      Logger.log("Waiting for context menu events...");
    }
  }

  private getTitle(origin: string) {
    return this.isSherlockDisabled(origin)
      ? `Enable Sherlock Assistant on this site`
      : `Disable Sherlock Assistant on this site`;
  }

  private clear() {
    chrome.contextMenus.removeAll();
  }

  private remove(origin: string) {
    chrome.contextMenus.remove(origin);
  }

  private create(origin: string) {
    chrome.contextMenus.create({
      id: origin,
      title: this.getTitle(origin),
      documentUrlPatterns: [`${origin}/*`],
    });
  }

  private update(origin: string) {
    chrome.contextMenus.update(origin, {
      title: this.getTitle(origin),
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

  refreshAll() {
    Object.keys(ORIGINS).map((origin) => {
      this.refreshTab(origin);
    });
  }

  refreshTab(origin: string) {
    try {
      // remove existing context menu item
      if (ORIGINS[origin]) {
        this.remove(origin);
      }

      // create new context menu item
      this.create(origin);
      ORIGINS[origin] = true;
    } catch (e) {
      // gracefully ignore errors
    }
  }

  async handleTab(message: ProviderRequest) {
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

    // retrieve origin from the event
    const origin = info.menuItemId;

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
    this.update(origin);
    await setWalletPreferences(this.preferences);
  }
}
