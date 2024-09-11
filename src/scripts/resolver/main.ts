import {isEthAddress} from "@unstoppabledomains/ui-components";
import {Logger} from "../../lib/logger";
import {scanForAddresses} from "../../lib/resolver/scanner";
import {isPartialAddress} from "../../lib/resolver/matcher";

// check preferences to ensure desired behavior
window.unstoppable?.getPreferences().then((preferences) => {
  // validate user scanning preferences
  if (preferences.Scanning) {
    // return if feature disabled
    if (!preferences.Scanning.Enabled) {
      return;
    }

    // return if host disabled
    const currentHost = window.location.href.toLowerCase();
    for (const ignoreHost of preferences.Scanning.IgnoreHosts) {
      if (currentHost.includes(ignoreHost.toLowerCase())) {
        return;
      }
    }
  }

  // start a resolver to scan page for addresses
  Logger.log("Starting address resolver");
  void scanForAddresses();

  // create an observer to watch for future DOM changes
  const observer = new MutationObserver((mutations) => {
    let isAnyMutations = false;
    mutations.forEach((mutation) => {
      let oldValue = mutation.oldValue;
      let newValue = mutation.target.textContent;
      if (oldValue !== newValue) {
        if (isEthAddress(newValue) || isPartialAddress(newValue)) {
          isAnyMutations = true;
        }
      }
    });
    if (isAnyMutations) {
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
