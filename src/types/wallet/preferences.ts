export type DefaultPageView = "legacy" | "onUpdated" | "wallet";

export interface WalletPreferences {
  DefaultView: DefaultPageView;
  HasExistingWallet: boolean;
  MessagingEnabled: boolean;
  OverrideMetamask: boolean;
  Scanning: {
    Enabled: boolean;
    IgnoreOrigins: string[];
  };
  TwoFactorAuth: {
    Enabled: boolean;
  };
  VersionInfo: string;
  WalletEnabled: boolean;
}
