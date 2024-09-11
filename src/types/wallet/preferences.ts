export type DefaultPageView = "legacy" | "onUpdated" | "wallet";

export interface WalletPreferences {
  WalletEnabled: boolean;
  HasExistingWallet: boolean;
  OverrideMetamask: boolean;
  DefaultView: DefaultPageView;
  Version: string;
}
