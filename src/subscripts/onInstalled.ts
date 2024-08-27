import {
  chromeStorageSet,
  StorageSyncKey,
  chromeStorageGet,
} from "../lib/chromeStorage";
import {Logger} from "../lib/logger";
import {ExtensionOptions, ExtensionURIMap} from "../types/redirect";

Logger.log("Background Script Started!");

chrome.runtime.onInstalled.addListener(async () => {
  // set base URL option if missing
  const baseUrl = await chromeStorageGet(StorageSyncKey.GatewayBaseURL);
  if (!baseUrl) {
    await chromeStorageSet(
      StorageSyncKey.GatewayBaseURL,
      ExtensionURIMap[ExtensionOptions.InfuraAPI],
    );
  }

  // set gateway option if missing
  const gateway = await chromeStorageGet(StorageSyncKey.GatewayOption);
  if (!gateway) {
    await chromeStorageSet(
      StorageSyncKey.GatewayOption,
      ExtensionOptions.InfuraAPI,
    );
  }

  Logger.log("Installed!");
});
