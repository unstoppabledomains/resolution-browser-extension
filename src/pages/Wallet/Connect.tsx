import React, {useEffect, useState} from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
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
import {Alert, Button, Typography} from "@unstoppabledomains/ui-kit";
import web3 from "web3";
import {
  ChainNotSupportedError,
  InvalidTypedMessageError,
  NotConnectedError,
  ProviderRequest,
  ResponseType,
  UnsupportedPermissionError,
  getResponseType,
  isConnectionRequired,
  isExternalRequestType,
  isPermissionType,
} from "../../types/wallet/provider";
import {isAscii} from "../../lib/wallet/isAscii";
import config from "../../config";
import {Logger} from "../../lib/logger";
import type {BootstrapState} from "@unstoppabledomains/ui-components/lib/types/fireBlocks";
import usePreferences from "../../hooks/usePreferences";
import useConnections from "../../hooks/useConnections";
import {getProviderRequest} from "../../lib/wallet/request";

enum ConnectionState {
  ACCOUNT,
  CHAINID,
  PERMISSIONS,
  SIGN,
  SWITCH_CHAIN,
}

const Connect: React.FC = () => {
  const {classes, cx} = useExtensionStyles();
  const [walletState] = useFireblocksState();
  const [t] = useTranslationContext();
  const {web3Deps, setWeb3Deps, setMessageToSign, setTxToSign} =
    useWeb3Context();
  const {preferences} = usePreferences();
  const {connections} = useConnections();
  const [isConnected, setIsConnected] = useState<boolean>();
  const [accountAssets, setAccountAssets] = useState<BootstrapState>();
  const [accountEvmAddresses, setAccountEvmAddresses] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();
  const isMounted = useIsMounted();

  // connection state management
  const [connectionStateMessage, setConnectionStateMessage] = useState<any>();
  const [connectionState, setConnectionState] = useState<ConnectionState>();

  // method to remove the window close listener, used to catch the situation
  // where user closes the window. If the window is closed by expected means,
  // this method is used to cancel the listener so the handler doesn't fire.
  let removeBeforeUnloadListener: () => void;

  useEffect(() => {
    // wait for required fields to be loaded
    if (!isMounted() || !preferences || !connections) {
      return;
    }

    // CTA to enable wallet if not yet enabled
    if (preferences && !preferences.WalletEnabled) {
      navigate("/onUpdated");
      return;
    }

    const loadWallet = async () => {
      try {
        const signInState = getBootstrapState(walletState);
        if (!signInState) {
          navigate("/wallet");
          return;
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
        setAccountAssets(signInState);
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
              Logger.error(
                e,
                "Popup",
                "unable to retrieve connection source tab",
              );
            }
          }
        }

        // determine app connection status
        const connectedHostname = new URL(connectionSource.url).hostname;
        setIsConnected(
          Object.keys(connections).filter(
            (c) => c.toLowerCase() === connectedHostname,
          ).length > 0,
        );

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
                  name: connectedHostname,
                  hostUrl: connectedHostname,
                  iconUrl: connectionSource.favIconUrl,
                }
              : undefined,
          },
        });
      } catch (e) {
        Logger.error(e, "Popup", "error loading wallet in connect popup");
      } finally {
        setIsLoaded(true);
      }
    };
    void loadWallet();
  }, [isMounted, connections, preferences]);

  useEffect(() => {
    // only register listeners with valid web3deps
    if (!web3Deps) {
      return;
    }

    // create and register message listeners
    const handleMessage = (message: ProviderRequest) => {
      // normalize message parameters
      if (
        message?.params &&
        message.params.length > 0 &&
        message.params[0].chainId
      ) {
        // normalize the chain ID
        const normalizedChainId = message.params[0].chainId.startsWith("0x")
          ? web3.utils.hexToNumber(message.params[0].chainId)
          : typeof message.params[0].chainId === "string"
            ? parseInt(message.params[0].chainId, 10)
            : message.params[0].chainId;
        const originalChainId = message.params[0].chainId;

        // normalize the chain name
        const normalizedChainName = accountAssets?.assets
          ?.map((a) => {
            return {
              name: a.blockchainAsset.blockchain.name,
              networkId: a.blockchainAsset.blockchain.networkId,
            };
          })
          .find((a) => a.networkId === normalizedChainId)?.name;

        // set normalized values
        message.params[0].chainId = String(normalizedChainId);
        message.params[0].chainName = normalizedChainName
          ? `the ${normalizedChainName} network`
          : `an unsupported network`;

        // set an error message if chain is not supported
        if (!normalizedChainName) {
          setErrorMessage(t("extension.unsupportedChain", {originalChainId}));
        }
      }

      try {
        // validate whether the given message type requires a connection
        // from the parent app
        if (
          !isConnected &&
          isExternalRequestType(message.type) &&
          isConnectionRequired(message.type)
        ) {
          // cannot continue if a connection is required for the given
          // message type
          throw new Error(NotConnectedError);
        }

        // handle the message
        switch (message.type) {
          case "accountRequest":
            setConnectionStateMessage(message);
            setConnectionState(ConnectionState.CHAINID);
            handleGetAccount();
            break;
          case "chainIdRequest":
            setConnectionStateMessage(message);
            setConnectionState(ConnectionState.CHAINID);
            handleGetChainId();
            break;
          case "requestPermissionsRequest":
            setConnectionStateMessage(message);
            setConnectionState(ConnectionState.PERMISSIONS);
            break;
          case "selectAccountRequest":
            setConnectionStateMessage(message);
            setConnectionState(ConnectionState.ACCOUNT);
            break;
          case "signMessageRequest":
            setConnectionStateMessage(message);
            setConnectionState(ConnectionState.SIGN);
            handleSignMessage(message.params[0]);
            break;
          case "signTypedMessageRequest":
            setConnectionStateMessage(message);
            setConnectionState(ConnectionState.SIGN);
            handleSignTypedMessage(message.params);
            break;
          case "sendTransactionRequest":
            setConnectionStateMessage(message);
            setConnectionState(ConnectionState.SIGN);
            handleSendTransaction(message.params[0]);
            break;
          case "switchChainRequest":
            setConnectionStateMessage(message);
            setConnectionState(ConnectionState.SWITCH_CHAIN);
            break;
          case "closeWindowRequest":
            handleClose();
            break;
          // the following messages types can silently be ignored, as they
          // are not relevant in the connect window
          case "getPreferencesRequest":
          case "newTabRequest":
          case "queueRequest":
          case "signInRequest":
          case "xmtpReadyRequest":
            return;
          default:
            // other unsupported method types can be ignored, but we'll show
            // a warning message for visibility
            Logger.warn("Ignoring unsupported message type", message);
            return;
        }

        // add a listener for unload, which will detect if a user manually closes
        // the window before handling the connection request
        const beforeUnloadHandler = handleUnexpectedClose(message);
        window.addEventListener("beforeunload", beforeUnloadHandler);
        removeBeforeUnloadListener = () =>
          window.removeEventListener("beforeunload", beforeUnloadHandler);
      } catch (e) {
        // handle the error
        handleError(getResponseType(message.type), e);
      }
    };
    chrome.runtime.onMessage.addListener(handleMessage);

    // manually handle a message that was sent along with the initial window
    // popup, since the event listener did not yet exist
    const providerRequest = getProviderRequest();
    if (providerRequest) {
      handleMessage(providerRequest);
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
      networkId =
        typeof connectionStateMessage.params[0].chainId === "string"
          ? parseInt(connectionStateMessage.params[0].chainId)
          : connectionStateMessage.params[0].chainId;
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

      // check for a valid response
      if (signature) {
        // return successful signature result
        chrome.runtime.sendMessage({
          type: "signMessageResponse",
          response: signature,
        });
        return;
      }
    } catch (e) {
      // handle signing error and cancel the operation
      Logger.error(
        e,
        "Signature",
        "error signing personal message",
        hexEncodedMessage,
      );
    }

    // the message was not signed, return an error to caller
    handleError(
      getResponseType("signMessageRequest"),
      new Error("personal message not signed"),
    );
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
      if (signature) {
        chrome.runtime.sendMessage({
          type: "signTypedMessageResponse",
          response: signature,
        });
        return;
      }
    } catch (e) {
      // handle signing error and cancel the operation
      Logger.error(e, "Signature", "error signing typed message", params);
    }

    // the message was not signed, return an error to caller
    handleError(
      getResponseType("signTypedMessageRequest"),
      new Error("typed message not signed"),
    );
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
    Logger.error(e, "Popup", "handled provider error", type);
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
    // remove the window unload listener, since this is an expected
    // call by the user to close the window
    if (removeBeforeUnloadListener) {
      removeBeforeUnloadListener();
    }
    window.close();
  };

  const handleUnexpectedClose = (message: any) => (_e: BeforeUnloadEvent) => {
    // called when the user manually closes the connection window, without
    // interacting with any of the buttons
    if (message) {
      handleError(
        getResponseType(message.type),
        new Error("user closed wallet"),
      );
    }
    return;
  };

  const renderButton = () => {
    if (errorMessage) {
      return (
        <Box mb={5}>
          <Alert severity="error">{errorMessage}</Alert>
        </Box>
      );
    } else if (
      [ConnectionState.ACCOUNT, ConnectionState.SWITCH_CHAIN].includes(
        connectionState,
      )
    ) {
      return (
        <Button
          onClick={handleConnectAccount}
          disabled={!isLoaded || errorMessage !== undefined}
          fullWidth
          variant="contained"
        >
          {t("common.connect")}
        </Button>
      );
    } else {
      return (
        <Button
          onClick={handleRequestPermissions}
          disabled={!isLoaded || errorMessage !== undefined}
          fullWidth
          variant="contained"
        >
          {t("wallet.approve")}
        </Button>
      );
    }
  };

  // show wallet connect information
  return (
    <Paper className={classes.container}>
      <Box className={cx(classes.walletContainer, classes.contentContainer)}>
        {[
          ConnectionState.ACCOUNT,
          ConnectionState.PERMISSIONS,
          ConnectionState.SWITCH_CHAIN,
        ].includes(connectionState) && (
          <Box className={classes.contentContainer}>
            <Typography variant="h4">{t("wallet.signMessage")}</Typography>
            {web3Deps?.unstoppableWallet?.connectedApp && (
              <SignForDappHeader
                name={web3Deps.unstoppableWallet.connectedApp.name}
                iconUrl={web3Deps.unstoppableWallet.connectedApp.iconUrl}
                hostUrl={web3Deps.unstoppableWallet.connectedApp.hostUrl}
                actionText={
                  connectionState === ConnectionState.PERMISSIONS
                    ? t("extension.connectRequest")
                    : connectionState === ConnectionState.SWITCH_CHAIN
                      ? t("extension.connectToChain", {
                          chainName: connectionStateMessage.params[0].chainName,
                        })
                      : t("extension.connect")
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
        )}
        <Box className={classes.contentContainer}>
          {renderButton()}
          <Box mt={1} className={classes.contentContainer}>
            <Button
              onClick={handleCancel}
              disabled={!isLoaded}
              fullWidth
              variant={errorMessage ? "contained" : "outlined"}
            >
              {t("common.cancel")}
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default Connect;
