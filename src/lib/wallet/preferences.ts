import config from "../../config";
import {WalletPreferences} from "../../types/wallet/preferences";
import {
  StorageSyncKey,
  chromeStorageGet,
  chromeStorageSet,
} from "../chromeStorage";
import {Logger} from "../logger";
import {PermissionType, hasOptionalPermissions} from "../runtime";

export const getWalletPreferences = async (): Promise<WalletPreferences> => {
  const defaultPreferences = getDefaultPreferences();

  try {
    const preferences = await chromeStorageGet<string>(
      StorageSyncKey.WalletPreferences,
    );
    if (preferences) {
      // base preferences stored in browser config
      const basePreferences: WalletPreferences = JSON.parse(preferences);

      // permission based preferences
      basePreferences.AppConnectionsEnabled = await hasOptionalPermissions([
        PermissionType.Tabs,
      ]);

      // normalize preferences before returning
      if (basePreferences.MessagingEnabled === undefined) {
        basePreferences.MessagingEnabled = defaultPreferences.MessagingEnabled;
      }
      if (basePreferences.Scanning === undefined) {
        basePreferences.Scanning = defaultPreferences.Scanning;
      }
      if (basePreferences.Scanning.AllowOrigins === undefined) {
        basePreferences.Scanning.AllowOrigins =
          defaultPreferences.Scanning.AllowOrigins;
      }
      if (basePreferences.TwoFactorAuth === undefined) {
        basePreferences.TwoFactorAuth = defaultPreferences.TwoFactorAuth;
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
    DefaultView: "wallet",
    VersionInfo: config.VERSION_DESCRIPTION,
    MessagingEnabled: true,
    AppConnectionsEnabled: false,
    Scanning: {
      Enabled: true,
      AllowOrigins: [
        // enable X by default
        "https://x.com",
        // enable any block scanner website by default
        "https://.*scan.*\\..+",
      ],
      IgnoreOrigins: [
        // disable Unstoppable Domains websites by default
        "https://ud.me",
        "https://up.io",
        "https://unstoppabledomains.com",
        "https://staging.ud.me",
        "https://staging.up.io",
        "https://ud-staging.com",
        "https://www.ud-staging.com",
      ],
    },
    TwoFactorAuth: {
      Enabled: false,
    },
  };
};

export const setWalletPreferences = async (preferences: WalletPreferences) => {
  await chromeStorageSet(
    StorageSyncKey.WalletPreferences,
    JSON.stringify(preferences),
  );
};
