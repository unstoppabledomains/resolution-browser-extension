import React, {useEffect, useState} from "react";
import {Box, Paper, Avatar} from "@mui/material";
import useIsMounted from "react-is-mounted-hook";
import type {Signer} from "ethers";
import queryString from "query-string";

import {useExtensionStyles} from "../../styles/extension.styles";
import {
  getBootstrapState,
  useFireblocksState,
  isEthAddress,
  useWeb3Context,
  ReactSigner,
} from "@unstoppabledomains/ui-components";
import {useNavigate} from "react-router-dom";
import {Button, Typography} from "@unstoppabledomains/ui-kit";
import web3 from "web3";
import {ProviderRequest} from "../../types/wallet";

enum ConnectionState {
  ACCOUNT,
  CHAINID,
  PERMISSIONS,
  SIGN,
}

const Connect: React.FC = () => {
  const {classes} = useExtensionStyles();
  const [walletState] = useFireblocksState();
  const {web3Deps, setWeb3Deps, setMessageToSign, setTxToSign} =
    useWeb3Context();
  const [accountEvmAddresses, setAccountEvmAddresses] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();
  const isMounted = useIsMounted();

  // connection state management
  const [connectionStateMessage, setConnectionStateMessage] = useState<any>();
  const [connectionState, setConnectionState] = useState<ConnectionState>();
  const [connectionSource, setConnectionSource] = useState<chrome.tabs.Tab>();

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

        // set web3 dependencies for connected wallet to enable prompts to
        // sign messages
        const signer = new ReactSigner(accountEvmAddresses[0].address, {
          setMessage: setMessageToSign,
          setTx: setTxToSign,
        }) as unknown as Signer;
        setWeb3Deps({
          signer,
          address: accountEvmAddresses[0].address,
          unstoppableWallet: {
            addresses: accountEvmAddresses.map((a) => a.address),
            promptForSignatures: true,
            fullScreenModal: true,
          },
        });
      } catch (e) {
        console.error(e, "error", "Wallet", "Configuration");
      } finally {
        setIsLoaded(true);
      }
    };
    void loadWallet();
  }, [isMounted]);

  useEffect(() => {
    // only register listeners with valid web3deps
    if (!web3Deps) {
      return;
    }

    // create and register message listeners
    const handleMessage = (message: ProviderRequest) => {
      setConnectionStateMessage(message);
      switch (message.type) {
        case "selectAccountRequest":
          setConnectionState(ConnectionState.ACCOUNT);
          break;
        case "selectChainIdRequest":
          setConnectionState(ConnectionState.CHAINID);
          break;
        case "requestPermissionsRequest":
          setConnectionState(ConnectionState.PERMISSIONS);
          break;
        case "signMessageRequest":
          setConnectionState(ConnectionState.SIGN);
          handleSignMessage(web3.utils.hexToUtf8(message.params[0]));
          break;
      }
    };
    chrome.runtime.onMessage.addListener(handleMessage);

    // parse available query string params for context data
    const queryStringArgs = queryString.parse(window.location.search);
    if (queryStringArgs && Object.keys(queryStringArgs).length > 0) {
      // manually handle a message that was sent along with the initial window
      // popup, since the event listener did not yet exist
      if (queryStringArgs.request) {
        const request = JSON.parse(queryStringArgs.request as string);
        if (request.type) {
          handleMessage(request);
        }
      }

      // retrieve the source tab information if available, used to show the name
      // and logo of the calling application
      if (queryStringArgs.source) {
        try {
          setConnectionSource(JSON.parse(queryStringArgs.source as string));
        } catch (e) {
          console.error("unable to retrieve source", e);
        }
      }
    }

    // cleanup listeners
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [web3Deps]);

  const handleConnectAccount = () => {
    chrome.runtime.sendMessage({
      type: "selectAccountResponse",
      address: accountEvmAddresses[0].address,
      chainId: accountEvmAddresses[0].networkId,
    });

    // close the popup
    handleClose();
  };

  const handleConnectChainId = () => {
    chrome.runtime.sendMessage({
      type: "selectChainIdResponse",
      chainId: accountEvmAddresses[0].networkId,
    });

    // close the popup
    handleClose();
  };

  const handleRequestPermissions = () => {
    // return the accepted permissions
    chrome.runtime.sendMessage({
      type: "requestPermissionsResponse",
      address: accountEvmAddresses[0].address,
      chainId: accountEvmAddresses[0].networkId,
      permissions: connectionStateMessage?.params
        ?.filter((permission: any) => {
          try {
            const permissionNames = Object.keys(permission);
            return permissionNames && permissionNames.length > 0;
          } catch (e) {
            return false;
          }
        })
        .map((permission: Record<string, any>) => {
          return {
            parentCapability: Object.keys(permission)[0],
          };
        }),
    });

    // close the popup
    handleClose();
  };

  const handleSignMessage = async (message: string) => {
    try {
      // request the signature
      const signature = await web3Deps.signer.signMessage(message);
      chrome.runtime.sendMessage({
        type: "signMessageResponse",
        response: signature,
      });

      // close the popup on success
      handleClose();
    } catch (e) {
      // handle signing error and cancel the operation
      console.error("error signing message", e);
      chrome.runtime.sendMessage({
        type: "signMessageResponse",
        error: String(e),
      });
      handleClose();
    }
  };

  const handleCancel = () => {
    chrome.runtime.sendMessage({
      type: connectionStateMessage.type.replace("Request", "Response"),
      error: "wallet request canceled",
    });
    handleClose();
  };

  const handleClose = () => {
    window.close();
  };

  const renderButton = () => {
    if (connectionState === ConnectionState.ACCOUNT) {
      return (
        <Button
          onClick={handleConnectAccount}
          disabled={!isLoaded}
          fullWidth
          variant="contained"
        >
          Connect
        </Button>
      );
    }

    if (connectionState === ConnectionState.CHAINID) {
      return (
        <Button
          onClick={handleConnectChainId}
          disabled={!isLoaded}
          fullWidth
          variant="contained"
        >
          Connect
        </Button>
      );
    }

    if (connectionState === ConnectionState.PERMISSIONS) {
      return (
        <Button
          onClick={handleRequestPermissions}
          disabled={!isLoaded}
          fullWidth
          variant="contained"
        >
          Approve
        </Button>
      );
    }
  };

  return (
    <Paper className={classes.container}>
      {[
        ConnectionState.ACCOUNT,
        ConnectionState.CHAINID,
        ConnectionState.PERMISSIONS,
      ].includes(connectionState) && (
        <Box className={classes.walletContainer}>
          <Box className={classes.contentContainer}>
            <Typography variant="h4">Connection Request</Typography>
            {connectionSource?.favIconUrl && (
              <Box mt={3} mb={3}>
                {
                  <Avatar
                    className={classes.walletIcon}
                    src={connectionSource.favIconUrl}
                  />
                }
              </Box>
            )}
            {connectionSource?.title && (
              <Typography>
                <b>{connectionSource.title}</b> wants to connect to Unstoppable
                Lite Wallet. Verify the website and wallet address before
                connecting.
              </Typography>
            )}
            {connectionSource?.url && (
              <Box className={classes.contentContainer}>
                <Typography
                  sx={{
                    fontWeight: "bold",
                  }}
                  mt={3}
                >
                  Website:
                </Typography>
                <Typography>
                  {new URL(connectionSource.url).hostname}
                </Typography>
              </Box>
            )}
            <Typography
              sx={{
                fontWeight: "bold",
              }}
              mt={3}
            >
              Wallet address:
            </Typography>
            <Typography>{accountEvmAddresses[0]?.address}</Typography>
          </Box>
          <Box className={classes.contentContainer}>
            {renderButton()}
            <Box mt={1} className={classes.contentContainer}>
              <Button
                onClick={handleCancel}
                disabled={!isLoaded}
                fullWidth
                variant="outlined"
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default Connect;
