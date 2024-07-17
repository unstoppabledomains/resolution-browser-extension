import {useState, useEffect, useCallback} from "react";
import {WalletState} from "../types";

const WALLET_STATE_KEY = "walletState";

export type WalletConnectionState = {
  state: WalletState;
};

const useWalletState = () => {
  const [walletState, setWalletState] =
    useState<WalletConnectionState>({
      state: WalletState.EmailAndPassword,
    });

    const [isLoadingWalletState, setIsLoadingWalletState] = useState(true);


  const loadWalletState = useCallback(() => {
    chrome.storage.sync.get(WALLET_STATE_KEY, (result) => {
      if (chrome.runtime.lastError) {
        console.error(
          "Failed to retrieve wallet state:",
          chrome.runtime.lastError,
        );
      } else {
        const state =
          result[WALLET_STATE_KEY]?.state ?? WalletState.EmailAndPassword;
        setWalletState({state});
        setIsLoadingWalletState(false);
      }
    });
  }, []);

  const saveWalletState = useCallback(
    (newState: WalletConnectionState) => {
      chrome.storage.sync.set({[WALLET_STATE_KEY]: newState}, () => {
        if (chrome.runtime.lastError) {
          console.error(
            "Failed to save wallet state:",
            chrome.runtime.lastError,
          );
        }
      });
    },
    [],
  );

  const updateWalletState = useCallback(
    (newState: WalletState) => {
      const updatedState = {state: newState};
      setWalletState(updatedState);
      saveWalletState(updatedState);
    },
    [saveWalletState],
  );

  useEffect(() => {
    loadWalletState();
  }, [loadWalletState]);

  return {
    walletState,
    isLoadingWalletState,
    updateWalletState,
  };
};

export default useWalletState;
