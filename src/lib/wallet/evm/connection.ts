import {ConnectedSite, ConnectedSites} from "../../../types/wallet/connection";
import {
  StorageSyncKey,
  chromeStorageSyncGet,
  chromeStorageSyncRemove,
  chromeStorageSyncSet,
} from "../../chromeStorageSync";
import {Logger} from "../../logger";

export const clearAllConnectedSites = async () => {
  await chromeStorageSyncRemove(StorageSyncKey.WalletConnections);
};

export const getConnectedSites = async (): Promise<ConnectedSites> => {
  const connectedSitesStr = await chromeStorageSyncGet(
    StorageSyncKey.WalletConnections,
  );
  if (connectedSitesStr) {
    const connections = JSON.parse(connectedSitesStr);
    return connections;
  }
  return {};
};

export const getConnectedSite = async (
  host: string,
): Promise<ConnectedSite | undefined> => {
  const connectedSites = await getConnectedSites();
  if (connectedSites && connectedSites[host.toLowerCase()]) {
    const connection = connectedSites[host.toLowerCase()];
    Logger.log("Wallet connection found", JSON.stringify({host, connection}));
    return connection;
  }
  Logger.log("Wallet connection not found", JSON.stringify({host}));
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
