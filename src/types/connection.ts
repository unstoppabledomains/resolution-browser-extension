export interface ConnectedSite {
  accounts: string[];
  chainId: number;
  permissions?: any[];
  timestamp: number;
}

export type ConnectedSites = Record<string, ConnectedSite>;
