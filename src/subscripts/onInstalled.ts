import {
  chromeStorageSyncSet,
  chromeStorageSyncClear,
  StorageSyncKey,
} from "../lib/chromeStorageSync";
import {Logger} from "../lib/logger";
import {ExtensionOptions, ExtensionURIMap} from "../types/redirect";

Logger.log("Background Script Started!");

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
  Logger.log("Installed!");
});
