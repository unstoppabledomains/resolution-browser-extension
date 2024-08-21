const CONNECTED_SITES_KEY = "connected_sites";

export interface ConnectedSite {
  accounts: string[];
  chainId: number;
  permissions?: any[];
  timestamp: number;
}

export type ConnectedSites = Record<string, ConnectedSite>;

export const clearAllConnectedSites = async () => {
  await chrome.storage.local.clear();
};

export const getConnectedSites = async (): Promise<ConnectedSites> => {
  const connectedSites = await chrome.storage.local.get(CONNECTED_SITES_KEY);
  if (connectedSites) {
    return connectedSites[CONNECTED_SITES_KEY];
  }
  return {};
};

export const getConnectedSite = async (
  host: string,
): Promise<ConnectedSite | undefined> => {
  const connectedSites = await getConnectedSites();
  if (!connectedSites) {
    return undefined;
  }
  if (connectedSites[host.toLowerCase()]) {
    return connectedSites[host.toLowerCase()];
  }
  return undefined;
};

export const setConnectedSites = async (connections: ConnectedSites) => {
  await chrome.storage.local.set({[CONNECTED_SITES_KEY]: connections});
};

export const setConnectedSite = async (
  host: string,
  connection: ConnectedSite | undefined,
) => {
  // retrieve existing connection if available
  const connectedSites = (await getConnectedSites()) || {};
  const existingConnection = connectedSites[host.toLowerCase()];

  // build normalized connection to store
  const normalizedConnection = existingConnection
    ? {...existingConnection, ...connection}
    : connection;

  // update site connections with the new value
  connectedSites[host.toLowerCase()] = normalizedConnection;
  await setConnectedSites(connectedSites);
};
