import {
  chromeStorageSyncSet,
  chromeStorageSyncClear,
  StorageSyncKey,
} from "../lib/chromeStorageSync";
import {ExtensionOptions, ExtensionURIMap} from "../types/redirect";

console.log("Background Script Started!");

chrome.runtime.onInstalled.addListener(() => {
  chromeStorageSyncClear().then(async () => {
    await chromeStorageSyncSet(
      StorageSyncKey.GatewayBaseURL,
      ExtensionURIMap[ExtensionOptions.InfuraAPI],
    );
    await chromeStorageSyncSet(
      StorageSyncKey.GatewayOption,
      ExtensionOptions.InfuraAPI,
    );
  });
  // chrome.tabs.create({url: "index.html#install"});
  console.log("Installed!");
});
