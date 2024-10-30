/* eslint-disable react/function-component-definition */

/* eslint-disable react/jsx-no-constructed-context-values */
import React, {useState} from "react";

import {ConnectedSites} from "../types/wallet/connection";

type Props = {
  children: React.ReactNode;
};

export const ConnectionContext = React.createContext<{
  connections?: ConnectedSites;
  setConnections?: (v: ConnectedSites) => void;
}>({});

const ConnectionProvider: React.FC<Props> = ({children}) => {
  const [connections, setConnections] = useState<ConnectedSites>();

  const value = {
    connections,
    setConnections,
  };

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
};

export default ConnectionProvider;
