import {isEthAddress} from "@unstoppabledomains/ui-components";
import {Logger} from "../../lib/logger";
import {scanForAddresses} from "../../lib/sherlock/scanner";
import {isPartialAddress} from "../../lib/sherlock/matcher";
import {ContextMenu} from "../../lib/sherlock/contextMenu";

// check preferences to ensure desired behavior
window.unstoppable?.getPreferences().then((preferences) => {
  // broadcast an event indicating this tab needs context menu update
  const contextMenu = new ContextMenu(preferences);
  contextMenu.broadcastTab();

  // only start the scanner if enabled
  if (contextMenu.isSherlockDisabled(window.location.origin)) {
    return;
  }

  // start a resolver to scan page for addresses
  Logger.log("Sherlock assistant enabled");
  void scanForAddresses();

  // create an observer to watch for future DOM changes
  const observer = new MutationObserver((mutations) => {
    let isAddressDetected = false;
    mutations.forEach((mutation) => {
      // address already detected
      if (isAddressDetected) {
        return;
      }

      // check for potential new addresses
      let oldValue = mutation.oldValue;
      let newValue = mutation.target.textContent;
      if (oldValue !== newValue) {
        // scan each child of the new node
        mutation.target.childNodes.forEach((newChild) => {
          // address already detected
          if (isAddressDetected) {
            return;
          }

          // check the text content of the child node
          const newChildValue = newChild.textContent;
          if (isEthAddress(newChildValue) || isPartialAddress(newChildValue)) {
            isAddressDetected = true;
            return;
          }
        });
      }
    });
    if (isAddressDetected) {
      void scanForAddresses();
    }
  });

  // wait for DOM changes
  observer.observe(document.body, {
    characterDataOldValue: true,
    subtree: true,
    childList: true,
    characterData: true,
  });
});
