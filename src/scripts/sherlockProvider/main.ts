import {isDomainValidForManagement} from "@unstoppabledomains/ui-components";

import {Logger} from "../../lib/logger";
import {ContextMenu} from "../../lib/sherlock/contextMenu";
import {isEthAddress, isPartialAddress} from "../../lib/sherlock/matcher";
import {scanForResolutions} from "../../lib/sherlock/scanner";

// check preferences to ensure desired behavior
void window.unstoppable?.getPreferences().then(preferences => {
  // broadcast an event indicating this tab needs context menu update
  const contextMenu = new ContextMenu(preferences);
  contextMenu.broadcastTab();

  // only start the scanner if enabled
  if (contextMenu.isSherlockDisabled(window.location.origin)) {
    return;
  }

  // only start the scanner for certain content types
  if (!["text/html"].includes(document.contentType?.toLowerCase())) {
    Logger.log(
      "Sherlock Assistant disabled for content type",
      document.contentType,
    );
    return;
  }

  // start a resolver to scan page for addresses
  Logger.log("Sherlock Assistant enabled");
  void scanForResolutions();

  // create an observer to watch for future DOM changes
  const observer = new MutationObserver(mutations => {
    let isAddressOrNameDetected = false;
    mutations.forEach(mutation => {
      // address or name already detected
      if (isAddressOrNameDetected) {
        return;
      }

      // check for potential new addresses
      const oldValue = mutation.oldValue;
      const newValue = mutation.target.textContent;
      if (oldValue !== newValue) {
        // a recursive helper to scan child node tree. The recursive search stops
        // as soon as a matching string is found.
        const scanChildren = (childNodes: NodeListOf<ChildNode>) => {
          childNodes.forEach(newChild => {
            // address already detected
            if (isAddressOrNameDetected) {
              return;
            }

            // check the text content of the child node
            const newChildValue = newChild.textContent;

            if (
              // match full EVM addresses
              isEthAddress(newChildValue || "") ||
              // match partial EVM addresses
              isPartialAddress(newChildValue || "") ||
              // match fully qualified domains
              isDomainValidForManagement(newChildValue || "")
            ) {
              isAddressOrNameDetected = true;
              return;
            }

            // scan any children
            if (newChild.childNodes && newChild.childNodes.length > 0) {
              scanChildren(newChild.childNodes);
            }
          });
        };

        // scan the child node tree
        scanChildren(mutation.target.childNodes);
      }
    });
    if (isAddressOrNameDetected) {
      void scanForResolutions();
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
