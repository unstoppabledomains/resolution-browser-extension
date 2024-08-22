import {WalletPreferences} from "../../types/wallet/preferences";
import {
  StorageSyncKey,
  chromeStorageSyncGet,
  chromeStorageSyncSet,
} from "../chromeStorageSync";
import {Logger} from "../logger";

export const getWalletPreferences = async (): Promise<WalletPreferences> => {
  try {
    const preferences = await chromeStorageSyncGet(
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

const getDefaultPreferences = (): WalletPreferences => {
  return {
    OverrideMetamask: false,
  };
};

export const setWalletPreferences = async (preferences: WalletPreferences) => {
  await chromeStorageSyncSet(
    StorageSyncKey.WalletPreferences,
    JSON.stringify(preferences),
  );
};
