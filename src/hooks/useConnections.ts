import {useContext, useEffect, useState} from "react";

import {
  getConnectedSites,
  removeConnectedSite,
} from "../lib/wallet/evm/connection";
import {ConnectionContext} from "../providers/ConnectionProvider";

const useConnections = () => {
  const {connections, setConnections} = useContext(ConnectionContext);
  const [isConnected, setIsConnected] = useState<boolean>();
  const [currentHost, setCurrentHost] = useState<string>();

  if (!setConnections) {
    throw new Error(
      "Expected useConnections to be called within <ConnectionProvider />",
    );
  }

  useEffect(() => {
    const loadConnections = async () => {
      setConnections(await getConnectedSites());
    };
    void loadConnections();
  }, []);

  useEffect(() => {
    if (!connections) {
      return;
    }

    const loadConnection = async () => {
      const activeTab = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (activeTab && activeTab.length > 0 && activeTab[0].url) {
        const activeHostname = new URL(activeTab[0].url).hostname.toLowerCase();
        setIsConnected(
          Object.keys(connections).filter(
            c => c.toLowerCase() === activeHostname,
          ).length > 0,
        );
        setCurrentHost(activeHostname);
      }
    };
    void loadConnection();
  }, [connections]);

  const disconnect = async (host?: string) => {
    const hostToDisconnect = host || currentHost;
    if (!hostToDisconnect) {
      return;
    }
    await removeConnectedSite(hostToDisconnect);
    setConnections(await getConnectedSites());
  };

  return {isConnected, connections, currentHost, disconnect, setConnections};
};

export default useConnections;
