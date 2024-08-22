import React, {useEffect, useState} from "react";
import {Box, Paper} from "@mui/material";
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
  CreateTransaction,
  SignForDappHeader,
  useTranslationContext,
} from "@unstoppabledomains/ui-components";
import {useNavigate} from "react-router-dom";
import {Button, Typography} from "@unstoppabledomains/ui-kit";
import web3 from "web3";
import {
  ChainNotSupportedError,
  InvalidTypedMessageError,
  NotConnectedError,
  ProviderRequest,
  ResponseType,
  UnsupportedPermissionError,
  UnsupportedRequestError,
  getResponseType,
  isPermissionType,
} from "../../types/wallet/provider";
import {isAscii} from "../../lib/wallet/isAscii";
import config from "../../config";
import {Logger} from "../../lib/logger";

enum ConnectionState {
  ACCOUNT,
  CHAINID,
  PERMISSIONS,
  SIGN,
}

const Connect: React.FC = () => {
  const {classes} = useExtensionStyles();
  const [walletState] = useFireblocksState();
  const [t] = useTranslationContext();
  const {web3Deps, setWeb3Deps, setMessageToSign, setTxToSign} =
    useWeb3Context();
  const [accountEvmAddresses, setAccountEvmAddresses] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();
  const isMounted = useIsMounted();

  // connection state management
  const [connectionStateMessage, setConnectionStateMessage] = useState<any>();
  const [connectionState, setConnectionState] = useState<ConnectionState>();

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

        // retrieve the source tab information if available, used to show the name
        // and logo of the calling application
        let connectionSource: chrome.tabs.Tab;
        const queryStringArgs = queryString.parse(window.location.search);
        if (queryStringArgs && Object.keys(queryStringArgs).length > 0) {
          if (queryStringArgs.source) {
            try {
              connectionSource = JSON.parse(queryStringArgs.source as string);
            } catch (e) {
              Logger.error("unable to retrieve source", e);
            }
          }
        }

        // set web3 dependencies for connected wallet to enable prompts to
        // sign messages
        const defaultAccount = accountEvmAddresses[0];
        const signer = new ReactSigner(defaultAccount.address, {
          setMessage: setMessageToSign,
          setTx: setTxToSign,
        }) as unknown as Signer;
        setWeb3Deps({
          signer,
          address: defaultAccount.address,
          unstoppableWallet: {
            addresses: accountEvmAddresses.map((a) => a.address),
            promptForSignatures: true,
            fullScreenModal: true,
            connectedApp: connectionSource
              ? {
                  name: connectionSource.title,
                  hostUrl: new URL(connectionSource.url).hostname,
                  iconUrl: connectionSource.favIconUrl,
                }
              : undefined,
          },
        });
      } catch (e) {
        Logger.error(e, "error", "Wallet", "Configuration");
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
      try {
        setConnectionStateMessage(message);
        switch (message.type) {
          case "accountRequest":
            setConnectionState(ConnectionState.CHAINID);
            handleGetAccount();
            break;
          case "chainIdRequest":
            setConnectionState(ConnectionState.CHAINID);
            handleGetChainId();
            break;
          case "requestPermissionsRequest":
            setConnectionState(ConnectionState.PERMISSIONS);
            break;
          case "selectAccountRequest":
            setConnectionState(ConnectionState.ACCOUNT);
            break;
          case "signMessageRequest":
            setConnectionState(ConnectionState.SIGN);
            handleSignMessage(message.params[0]);
            break;
          case "signTypedMessageRequest":
            setConnectionState(ConnectionState.SIGN);
            handleSignTypedMessage(message.params);
            break;
          case "sendTransactionRequest":
            setConnectionState(ConnectionState.SIGN);
            handleSendTransaction(message.params[0]);
            break;
          case "switchChainRequest":
            setConnectionState(ConnectionState.ACCOUNT);
            break;
          case "closeWindowRequest":
            handleClose();
            break;
          default:
            // unsupported method type
            Logger.log("Unsupported message type", message);
            throw new Error(UnsupportedRequestError);
        }
      } catch (e) {
        // handle the error
        handleError(getResponseType(message.type), e);
      }
    };
    chrome.runtime.onMessage.addListener(handleMessage);

    // manually handle a message that was sent along with the initial window
    // popup, since the event listener did not yet exist
    const queryStringArgs = queryString.parse(window.location.search);
    if (queryStringArgs && Object.keys(queryStringArgs).length > 0) {
      if (queryStringArgs.request) {
        const request = JSON.parse(queryStringArgs.request as string);
        if (request.type) {
          handleMessage(request);
        }
      }
    }

    // cleanup listeners
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [web3Deps]);

  const getAccount = (chainId: number = config.DEFAULT_CHAIN) => {
    const matchingAccount = accountEvmAddresses.find(
      (a) => chainId === a.networkId,
    );
    return matchingAccount?.address ? matchingAccount : accountEvmAddresses[0];
  };

  const handleGetChainId = () => {
    // retrieve the default account
    const defaultAccount = getAccount();
    if (!defaultAccount) {
      handleError("chainIdResponse", new Error(NotConnectedError));
      return;
    }

    // return the connected account
    chrome.runtime.sendMessage({
      type: "chainIdResponse",
      chainId: defaultAccount.networkId,
    });
  };

  const handleGetAccount = () => {
    // retrieve the default account
    const defaultAccount = getAccount();
    if (!defaultAccount) {
      handleError("accountResponse", new Error(NotConnectedError));
      return;
    }

    // return the connected account
    chrome.runtime.sendMessage({
      type: "accountResponse",
      address: defaultAccount.address,
      chainId: defaultAccount.networkId,
    });
  };

  const handleConnectAccount = () => {
    // determine if a specific account is requested, defaulting to the
    // first available entry if none specified
    const defaultAccount = getAccount();
    let networkId = defaultAccount.networkId;
    if (
      connectionStateMessage?.params &&
      connectionStateMessage.params.length > 0 &&
      connectionStateMessage.params[0].chainId
    ) {
      networkId = parseInt(
        connectionStateMessage.params[0].chainId.replaceAll("0x", ""),
      );
    }

    // find the requested chain
    const account = getAccount(networkId);
    if (account?.networkId !== networkId) {
      handleError(
        getResponseType(connectionStateMessage.type),
        new Error(ChainNotSupportedError),
      );
      return;
    }

    // return the connected account
    chrome.runtime.sendMessage({
      type: getResponseType(connectionStateMessage.type),
      address: account.address,
      chainId: account.networkId,
    });
  };

  const handleRequestPermissions = () => {
    try {
      // generate the accepted permissions list
      const account = getAccount();
      const acceptedPermissions: any[] = [];
      connectionStateMessage?.params
        // ensure a permission has been provided
        ?.filter((permissions: any) => {
          if (typeof permissions !== "string") {
            try {
              const permissionNames = Object.keys(permissions);
              return permissionNames && permissionNames.length > 0;
            } catch (e) {
              return false;
            }
          }
          return false;
        })
        // handle requested permissions
        .map((permissions: Record<string, Record<string, string>>) => {
          Object.keys(permissions).map((permission) => {
            // validate the requested permission is supported
            if (!isPermissionType(permission)) {
              throw new Error(`${UnsupportedPermissionError}: ${permission}`);
            }

            // add permission to accepted permission list
            acceptedPermissions.push({
              parentCapability: permission,
              invoker: "https://docs.metamask.io",
              context: ["https://github.com/MetaMask/rpc-cap"],
              date: new Date().getTime(),
              caveats: [
                {
                  name: "primaryAccountOnly",
                  type: "limitResponseLength",
                  value: 1,
                },
                {
                  name: "exposedAccounts",
                  type: "filterResponse",
                  value: [account.address],
                },
              ],
            });
          });
        });

      // return the accepted permissions
      chrome.runtime.sendMessage({
        type: "requestPermissionsResponse",
        address: account.address,
        chainId: account.networkId,
        permissions: acceptedPermissions,
      });
    } catch (e) {
      handleError(getResponseType("requestPermissionsRequest"), e);
    }
  };

  const handleSignMessage = async (hexEncodedMessage: string) => {
    try {
      // prepare the message to sign, which is currently hex encoded. If decoding the hex
      // message yields an ASCII-only string, then sign the decoded string. Otherwise, we
      // assume the hex string is a raw message and should be signed as-is.
      const maybeAsciiMessage = web3.utils.hexToUtf8(hexEncodedMessage);
      const message = isAscii(maybeAsciiMessage)
        ? maybeAsciiMessage
        : hexEncodedMessage;

      // request the signature
      const signature = await web3Deps.signer.signMessage(message);
      chrome.runtime.sendMessage({
        type: "signMessageResponse",
        response: signature,
      });
    } catch (e) {
      // handle signing error and cancel the operation
      handleError("signMessageResponse", e);
    }
  };

  const handleSignTypedMessage = async (params: any[]) => {
    try {
      // validate there are at least two available parameter args
      if (params.length < 2) {
        handleError(
          "signTypedMessageResponse",
          new Error(InvalidTypedMessageError),
        );
        return;
      }

      // the second request argument contains an encoded typed message, which
      // must be submitted for a signature request
      const signature = await web3Deps.signer.signMessage(params[1]);
      chrome.runtime.sendMessage({
        type: "signTypedMessageResponse",
        response: signature,
      });
    } catch (e) {
      // handle signing error and cancel the operation
      handleError("signTypedMessageResponse", e);
    }
  };

  const handleSendTransaction = async (txParams: Record<string, string>) => {
    try {
      // prepare a transaction to be signed
      const txRequest: CreateTransaction = {
        chainId: parseInt(txParams.chainId),
        to: txParams.to,
        data: txParams.data,
        value: txParams.value || "0",
      };

      // sign the transaction and return the hash, so the user
      // can be prompted to approve the transaction
      const txHash = await web3Deps.signer.signTransaction(txRequest);
      chrome.runtime.sendMessage({
        type: "sendTransactionResponse",
        response: txHash,
      });
    } catch (e) {
      // handle signing error and cancel the operation
      handleError("sendTransactionResponse", e);
    }
  };

  const handleError = (type: ResponseType, e: Error) => {
    // handle provider error and cancel the operation
    Logger.error("handling provider error", type, e);
    chrome.runtime.sendMessage({
      type,
      error: String(e),
    });
    handleClose();
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
          {t("common.connect")}
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
          {t("wallet.approve")}
        </Button>
      );
    }
  };

  return (
    <Paper className={classes.container}>
      {[ConnectionState.ACCOUNT, ConnectionState.PERMISSIONS].includes(
        connectionState,
      ) && (
        <Box className={classes.walletContainer}>
          <Box className={classes.contentContainer}>
            <Typography variant="h4">{t("wallet.signMessage")}</Typography>
            {web3Deps?.unstoppableWallet?.connectedApp && (
              <SignForDappHeader
                name={web3Deps.unstoppableWallet.connectedApp.name}
                iconUrl={web3Deps.unstoppableWallet.connectedApp.iconUrl}
                hostUrl={web3Deps.unstoppableWallet.connectedApp.hostUrl}
                actionText={
                  connectionState === ConnectionState.PERMISSIONS
                    ? "request permission to view your wallet and prompt for transactions"
                    : "connect"
                }
              />
            )}
            <Typography variant="body1" mt={3}>
              {t("auth.walletAddress")}:
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontWeight: "bold",
              }}
            >
              {getAccount()?.address}
            </Typography>
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
                {t("common.cancel")}
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default Connect;
