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
  VersionInfo: string;
  WalletEnabled: boolean;
}
