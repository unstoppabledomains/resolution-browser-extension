import {WalletPreferences} from "../../types/wallet/preferences";
import {
  StorageSyncKey,
  chromeStorageGet,
  chromeStorageSet,
} from "../chromeStorage";
import {Logger} from "../logger";

export const getWalletPreferences = async (): Promise<WalletPreferences> => {
  try {
    const preferences = await chromeStorageGet(
      StorageSyncKey.WalletPreferences,
    );
    if (preferences) {
      return JSON.parse(preferences);
    }
  } catch (e) {
    Logger.warn("error retrieving preferences", e);
  }
  return getDefaultPreferences();
};

export const getDefaultPreferences = (): WalletPreferences => {
  return {
    WalletEnabled: false,
    HasExistingWallet: false,
    OverrideMetamask: false,
    DefaultView: "onUpdated",
    Version: chrome.runtime.getManifest().version,
    Scanning: {
      Enabled: true,
      IgnoreOrigins: [
        "https://ud.me",
        "https://unstoppabledomains.com",
        "https://staging.ud.me",
        "https://ud-staging.com",
        "https://www.ud-staging.com",
      ],
    },
  };
};

export const setWalletPreferences = async (preferences: WalletPreferences) => {
  await chromeStorageSet(
    StorageSyncKey.WalletPreferences,
    JSON.stringify(preferences),
  );
};
