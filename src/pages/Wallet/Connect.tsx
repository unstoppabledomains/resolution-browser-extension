import React, {useEffect, useState} from "react";
import {Box, Paper} from "@mui/material";
import useIsMounted from "react-is-mounted-hook";

import {useExtensionStyles} from "../../styles/extension.styles";
import {
  getBootstrapState,
  useFireblocksState,
  isEthAddress,
} from "@unstoppabledomains/ui-components";
import {useNavigate} from "react-router-dom";
import {Button, Typography} from "@unstoppabledomains/ui-kit";

enum ConnectionState {
  ACCOUNT,
  CHAINID,
  SIGN,
}

const Connect: React.FC = () => {
  const {classes} = useExtensionStyles();
  const [walletState] = useFireblocksState();
  const [accountEvmAddresses, setAccountEvmAddresses] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [authComplete, setAuthComplete] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const isMounted = useIsMounted();
  const [connectionState, setConnectionState] = useState(
    ConnectionState.ACCOUNT,
  );

  useEffect(() => {
    if (!isMounted()) {
      return;
    }

    const loadWallet = async () => {
      try {
        const signInState = getBootstrapState(walletState);
        if (!signInState) {
          navigate("/wallet");
        }

        const accountEvmAddresses = [
          ...new Set(
            signInState.assets
              ?.map((a) => {
                return {
                  address: a.address,
                  networkId: a.blockchainAsset.blockchain.networkId,
                };
              })
              .filter((a) => isEthAddress(a.address)),
          ),
        ];

        if (accountEvmAddresses.length === 0) {
          return;
        }

        setAccountEvmAddresses(accountEvmAddresses);
      } catch (e) {
        console.error(e, "error", "Wallet", "Configuration");
      } finally {
        setIsLoaded(true);
      }
    };
    void loadWallet();
  }, [isMounted, authComplete]);

  useEffect(() => {
    const handleMessage = (message) => {
      if (message.type === "selectChainIdRequest") {
        setConnectionState(ConnectionState.CHAINID);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const handleConnectAccount = () => {
    chrome.runtime.sendMessage({
      type: "selectAccountResponse",
      address: accountEvmAddresses[0].address,
      chainId: accountEvmAddresses[0].networkId,
    });
  };

  const handleConnectChainId = () => {
    chrome.runtime.sendMessage({
      type: "selectChainIdResponse",
      chainId: accountEvmAddresses[0].networkId,
    });
  };

  const showButton = () => {
    if (connectionState === ConnectionState.ACCOUNT) {
      return (
        <Button
          onClick={() => {
            handleConnectAccount();
          }}
          disabled={!isLoaded}
        >
          Connect Account
        </Button>
      );
    }

    if (connectionState === ConnectionState.CHAINID) {
      return (
        <Button
          onClick={() => {
            handleConnectChainId();
          }}
          disabled={!isLoaded}
        >
          Connect Chain ID
        </Button>
      );
    }
  };

  return (
    <Paper className={classes.container}>
      <Box>
        <Typography
          sx={{
            fontWeight: "bold",
          }}
        >
          Address:
        </Typography>
        <Typography>{accountEvmAddresses[0]?.address}</Typography>

        <Typography
          sx={{
            fontWeight: "bold",
          }}
        >
          Chain ID:
        </Typography>
        <Typography>{accountEvmAddresses[0]?.networkId}</Typography>
      </Box>

      {showButton()}
    </Paper>
  );
};

export default Connect;
