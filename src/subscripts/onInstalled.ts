import {
  chromeStorageSet,
  chromeStorageClear,
  StorageSyncKey,
} from "../lib/chromeStorage";
import {Logger} from "../lib/logger";
import {ExtensionOptions, ExtensionURIMap} from "../types/redirect";

Logger.log("Background Script Started!");

chrome.runtime.onInstalled.addListener(() => {
  chromeStorageClear().then(async () => {
    await chromeStorageSet(
      StorageSyncKey.GatewayBaseURL,
      ExtensionURIMap[ExtensionOptions.InfuraAPI],
    );
    await chromeStorageSet(
      StorageSyncKey.GatewayOption,
      ExtensionOptions.InfuraAPI,
    );
  });
  Logger.log("Installed!");
});
