import {useContext} from "react";

import {Web3Context} from "../providers/Web3ContextProvider";

const useWeb3Context = () => {
  const {
    web3Deps,
    setWeb3Deps,
    accessToken,
    setAccessToken,
    messageToSign,
    setMessageToSign,
    sessionKeyState,
    setSessionKeyState,
    persistentKeyState,
    setPersistentKeyState,
  } = useContext(Web3Context);
  if (
    !setWeb3Deps ||
    !setAccessToken ||
    !setMessageToSign ||
    !setSessionKeyState ||
    !setPersistentKeyState
  ) {
    throw new Error(
      "Expected useWeb3Context to be called within <Web3ContextProvider />",
    );
  }
  return {
    web3Deps,
    setWeb3Deps,
    accessToken,
    setAccessToken,
    messageToSign,
    setMessageToSign,
    sessionKeyState,
    setSessionKeyState,
    persistentKeyState,
    setPersistentKeyState,
  };
};

export default useWeb3Context;
