export type DefaultPageView = "legacy" | "onUpdated" | "wallet";

export interface WalletPreferences {
  WalletEnabled: boolean;
  OverrideMetamask: boolean;
  DefaultView: DefaultPageView;
  Version: string;
}
