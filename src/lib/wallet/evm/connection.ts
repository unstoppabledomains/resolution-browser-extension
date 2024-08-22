import {ConnectedSite, ConnectedSites} from "../../../types/connection";
import {
  StorageSyncKey,
  chromeStorageSyncGet,
  chromeStorageSyncRemove,
  chromeStorageSyncSet,
} from "../../chromeStorageSync";

export const clearAllConnectedSites = async () => {
  await chromeStorageSyncRemove(StorageSyncKey.WalletConnections);
};

export const getConnectedSites = async (): Promise<ConnectedSites> => {
  const connectedSitesStr = await chromeStorageSyncGet(
    StorageSyncKey.WalletConnections,
  );
  if (connectedSitesStr) {
    return JSON.parse(connectedSitesStr);
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
  await chromeStorageSyncSet(
    StorageSyncKey.WalletConnections,
    JSON.stringify(connections),
  );
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
