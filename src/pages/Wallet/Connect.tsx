import React, {useEffect, useState} from "react";
import {Box, Paper} from "@mui/material";
import useIsMounted from "react-is-mounted-hook";

import {useExtensionStyles} from "../../styles/extension.styles";
import {
  getBootstrapState,
  useFireblocksState,
  isEthAddress,
  useWeb3Context,
} from "@unstoppabledomains/ui-components";
import {useNavigate} from "react-router-dom";
import {Button, Typography} from "@unstoppabledomains/ui-kit";
import web3 from "web3";

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

  const {web3Deps} = useWeb3Context();

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

      if (message.type === "signMessageRequest" && message.params?.length > 0) {
        setConnectionState(ConnectionState.SIGN);
        setMessage(message.params[0]);
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

  const handleSignMessage = async () => {
    if (message && accountEvmAddresses) {
      // const signature = await web3Deps.signer.signMessage(message);
      console.log("signature", web3Deps);
    }
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

  const showConnect = () => {
    return (
      <Box>
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

        <Box>{showButton()}</Box>
      </Box>
    );
  };

  const renderContent = () => {
    if (
      connectionState === ConnectionState.ACCOUNT ||
      connectionState === ConnectionState.CHAINID
    ) {
      return showConnect();
    } else if (connectionState === ConnectionState.SIGN) {
      return (
        <Box>
          <Typography
            sx={{
              fontWeight: "bold",
            }}
          >
            Message to sign:
          </Typography>
          <Typography>{web3.utils.hexToUtf8(message)}</Typography>

          <Button
            onClick={() => {
              handleSignMessage();
            }}
            disabled={!isLoaded}
          >
            Sign
          </Button>
        </Box>
      );
    } else {
      navigate("/wallet");
    }
  };

  return <Paper className={classes.container}>{renderContent()}</Paper>;
};

export default Connect;
