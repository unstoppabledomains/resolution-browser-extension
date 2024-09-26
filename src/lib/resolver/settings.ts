import {ExtensionOptions, ExtensionURIMap} from "../../types/redirect";
import {
  StorageSyncKey,
  chromeStorageGet,
  chromeStorageSet,
} from "../chromeStorage";

export const initializeBrowserSettings = async () => {
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
};
