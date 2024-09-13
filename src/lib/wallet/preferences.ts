import {WalletPreferences} from "../../types/wallet/preferences";
import {
  StorageSyncKey,
  chromeStorageGet,
  chromeStorageSet,
} from "../chromeStorage";
import {Logger} from "../logger";

export const getWalletPreferences = async (): Promise<WalletPreferences> => {
  const defaultPreferences = getDefaultPreferences();

  try {
    const preferences = await chromeStorageGet(
      StorageSyncKey.WalletPreferences,
    );
    if (preferences) {
      // base preferences stored in browser config
      const basePreferences: WalletPreferences = JSON.parse(preferences);

      // normalize preferences before returning
      if (basePreferences.MessagingEnabled === undefined) {
        basePreferences.MessagingEnabled = defaultPreferences.MessagingEnabled;
      }
      if (basePreferences.Scanning === undefined) {
        basePreferences.Scanning = defaultPreferences.Scanning;
      }

      // return normalized preferences
      return basePreferences;
    }
  } catch (e) {
    Logger.warn("error retrieving preferences", e);
  }
  // use default preferences
  return defaultPreferences;
};

export const getDefaultPreferences = (): WalletPreferences => {
  return {
    WalletEnabled: false,
    HasExistingWallet: false,
    OverrideMetamask: false,
    DefaultView: "onUpdated",
    Version: chrome.runtime.getManifest().version,
    MessagingEnabled: true,
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
