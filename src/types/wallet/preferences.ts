export type DefaultPageView = "legacy" | "onUpdated" | "wallet";

export interface WalletPreferences {
  DefaultView: DefaultPageView;
  HasExistingWallet: boolean;
  MessagingEnabled: boolean;
  AppConnectionsEnabled: boolean;
  OverrideMetamask: boolean;
  Scanning: {
    Enabled: boolean;
    AllowOrigins: string[];
    IgnoreOrigins: string[];
  };
  TwoFactorAuth: {
    Enabled: boolean;
  };
  VersionInfo: string;
  WalletEnabled: boolean;
}
