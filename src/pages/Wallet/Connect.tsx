import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import {PublicKey} from "@solana/web3.js";
import {fetcher} from "@xmtp/proto";
import type {Signer} from "ethers";
import Markdown from "markdown-to-jsx";
import queryString from "query-string";
import React, {useEffect, useState} from "react";
import useIsMounted from "react-is-mounted-hook";
import {useNavigate} from "react-router-dom";
import web3 from "web3";

import {
  CreateTransaction,
  ReactSigner,
  SignForDappHeader,
  getBootstrapState,
  isEthAddress,
  useFireblocksState,
  useTranslationContext,
  useWeb3Context,
} from "@unstoppabledomains/ui-components";
import type {BootstrapState} from "@unstoppabledomains/ui-components/lib/types/fireBlocks";
import {Alert, Button, Typography} from "@unstoppabledomains/ui-kit";

import config from "../../config";
import useConnections from "../../hooks/useConnections";
import usePreferences from "../../hooks/usePreferences";
import {StorageSyncKey, chromeStorageGet} from "../../lib/chromeStorage";
import {Logger} from "../../lib/logger";
import {isAscii} from "../../lib/wallet/isAscii";
import {getProviderRequest} from "../../lib/wallet/request";
import {useExtensionStyles} from "../../styles/extension.styles";
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

// define connection popup states
enum ConnectionState {
  ACCOUNT = 1,
  CHAINID,
  PERMISSIONS,
  SIGN,
  SWITCH_CHAIN,
  SOLANA_SIGN_MESSAGE,
  SOLANA_SIGN_TX,
}

// define groups of connection popup states
const SOLANA_STATES = [
  ConnectionState.SOLANA_SIGN_MESSAGE,
  ConnectionState.SOLANA_SIGN_TX,
];
const CONNECT_ACCOUNT_STATES = [
  ConnectionState.ACCOUNT,
  ConnectionState.SWITCH_CHAIN,
];
const RENDER_CONTENT_STATES = [
  ConnectionState.PERMISSIONS,
  ...CONNECT_ACCOUNT_STATES,
  ...SOLANA_STATES,
];

interface connectedAccount {
  address: string;
  networkId?: number | string;
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
  const [accountAddresses, setAccountAddresses] = useState<connectedAccount[]>(
    [],
  );
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
    if (!isMounted() || !preferences || !connections || isLoaded) {
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
          // check fireblocks state in chrome storage, and wait for a value to
          // be present if it is found to prevent unnecessary redirect.
          if (await chromeStorageGet(StorageSyncKey.FireblocksState, "local")) {
            return;
          }

          // redirect to wallet sign in page
          navigate("/wallet");
          return;
        }

        // build list of EVM addresses
        const evmAddresses = [
          ...new Set(
            signInState.assets
              ?.map(a => {
                return {
                  address: a.address,
                  networkId: a.blockchainAsset.blockchain.networkId,
                };
              })
              .filter(a => isEthAddress(a.address)),
          ),
        ];

        // build list of Solana addresses
        const solanaAddresses = [
          ...new Set(
            signInState.assets
              ?.map(a => {
                return {
                  address: a.address,
                  networkId: "solana",
                };
              })
              .filter(a => {
                try {
                  return PublicKey.isOnCurve(a.address);
                } catch (e) {
                  return false;
                }
              }),
          ),
        ];

        if (evmAddresses.length === 0 && solanaAddresses.length === 0) {
          return;
        }
        setAccountAssets(signInState);
        setAccountAddresses([...evmAddresses, ...solanaAddresses]);

        // retrieve the source tab information if available, used to show the name
        // and logo of the calling application
        let connectionSource: chrome.tabs.Tab | undefined;
        const queryStringArgs = queryString.parse(window.location.search);
        if (queryStringArgs && Object.keys(queryStringArgs).length > 0) {
          if (queryStringArgs.source) {
            try {
              connectionSource = JSON.parse(queryStringArgs.source as string);
            } catch (e: any) {
              Logger.error(
                e,
                "Popup",
                "unable to retrieve connection source tab",
              );
            }
          }
        }

        // determine app connection status
        const connectedHostname = connectionSource?.url
          ? new URL(connectionSource.url).hostname
          : undefined;
        setIsConnected(
          connectedHostname !== undefined &&
            Object.keys(connections).filter(
              c => c.toLowerCase() === connectedHostname,
            ).length > 0,
        );

        // set web3 dependencies for connected wallet to enable prompts to
        // sign messages
        const defaultAccount = evmAddresses[0];
        const signer = new ReactSigner(defaultAccount.address, {
          setMessage: setMessageToSign,
          setTx: setTxToSign,
        }) as unknown as Signer;
        setWeb3Deps({
          signer,
          address: defaultAccount.address,
          unstoppableWallet: {
            addresses: evmAddresses.map(a => a.address),
            promptForSignatures: true,
            fullScreenModal: true,
            connectedApp:
              connectionSource?.favIconUrl && connectedHostname
                ? {
                    name: connectedHostname,
                    hostUrl: connectedHostname,
                    iconUrl: connectionSource.favIconUrl,
                  }
                : undefined,
          },
        });
      } catch (e: any) {
        Logger.error(e, "Popup", "error loading wallet in connect popup");
      } finally {
        setIsLoaded(true);
      }
    };
    void loadWallet();
  }, [isMounted, connections, preferences, walletState]);

  useEffect(() => {
    // only register listeners with valid web3deps
    if (!web3Deps) {
      return;
    }

    // create and register message listeners
    const handleMessage = async (message: ProviderRequest) => {
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
          ?.map(a => {
            return {
              name: a.blockchainAsset.blockchain.name,
              networkId: a.blockchainAsset.blockchain.networkId,
            };
          })
          .find(a => a.networkId === normalizedChainId)?.name;

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
          // EVM handlers
          case "accountRequest":
            setConnectionStateMessage(message);
            setConnectionState(ConnectionState.CHAINID);
            await handleGetAccount();
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
            await handleSignMessage(message.params[0]);
            break;
          case "signTypedMessageRequest":
            setConnectionStateMessage(message);
            setConnectionState(ConnectionState.SIGN);
            await handleSignTypedMessage(message.params);
            break;
          case "sendTransactionRequest":
            setConnectionStateMessage(message);
            setConnectionState(ConnectionState.SIGN);
            await handleSendTransaction(message.params[0]);
            break;
          case "switchChainRequest":
            setConnectionStateMessage(message);
            setConnectionState(ConnectionState.SWITCH_CHAIN);
            break;
          case "closeWindowRequest":
            handleClose();
            break;
          // Solana handlers
          case "signSolanaMessageRequest":
            setConnectionStateMessage(message);
            setConnectionState(ConnectionState.SOLANA_SIGN_MESSAGE);
            break;
          // the following messages types can silently be ignored, as they
          // are not relevant in the connect window
          case "getPreferencesRequest":
          case "newTabRequest":
          case "queueRequest":
          case "signInRequest":
          case "xmtpReadyRequest":
          case "prepareXmtpRequest":
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
      } catch (e: any) {
        // handle the error
        await handleError(getResponseType(message.type), e);
      }
    };
    chrome.runtime.onMessage.addListener(handleMessage);

    // manually handle a message that was sent along with the initial window
    // popup, since the event listener did not yet exist
    const providerRequest = getProviderRequest();
    if (providerRequest) {
      void handleMessage(providerRequest);
    }

    // cleanup listeners
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [web3Deps]);

  const getAccount = (chainId?: number | string) => {
    // if chainID is not specified, determine the default
    if (!chainId) {
      // determine type of permission request
      const isSolana =
        (connectionState && SOLANA_STATES.includes(connectionState)) ||
        (connectionStateMessage?.params &&
          connectionStateMessage.params.length > 0 &&
          !!connectionStateMessage.params[0].solana_accounts);
      chainId = isSolana ? "solana" : config.DEFAULT_CHAIN;
    }

    const matchingAccount = accountAddresses.find(a => chainId === a.networkId);
    return matchingAccount?.address ? matchingAccount : accountAddresses[0];
  };

  const handleGetChainId = () => {
    // retrieve the default account
    const defaultAccount = getAccount();
    if (!defaultAccount) {
      void handleError("chainIdResponse", new Error(NotConnectedError));
      return;
    }

    // return the connected account
    void chrome.runtime.sendMessage({
      type: "chainIdResponse",
      chainId: defaultAccount.networkId,
    });
  };

  const handleGetAccount = async () => {
    // retrieve the default account
    const defaultAccount = getAccount();
    if (!defaultAccount) {
      await handleError("accountResponse", new Error(NotConnectedError));
      return;
    }

    // return the connected account
    void chrome.runtime.sendMessage({
      type: "accountResponse",
      address: defaultAccount.address,
      chainId: defaultAccount.networkId,
    });
  };

  const handleConnectAccount = async () => {
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
          ? parseInt(connectionStateMessage.params[0].chainId, 10)
          : connectionStateMessage.params[0].chainId;
    }

    // find the requested chain
    const account = getAccount(networkId);
    if (account?.networkId !== networkId) {
      await handleError(
        getResponseType(connectionStateMessage.type),
        new Error(ChainNotSupportedError),
      );
      return;
    }

    // return the connected account
    await chrome.runtime.sendMessage({
      type: getResponseType(connectionStateMessage.type),
      address: account.address,
      chainId: account.networkId,
    });
  };

  const handleRequestPermissions = async () => {
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
          Object.keys(permissions).map(permission => {
            // validate the requested permission is supported
            if (!isPermissionType(permission)) {
              throw new Error(`${UnsupportedPermissionError}: ${permission}`);
            }

            // add permission to accepted permission list
            acceptedPermissions.push({
              account,
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
      await chrome.runtime.sendMessage({
        type: "requestPermissionsResponse",
        address: account.address,
        chainId: account.networkId,
        permissions: acceptedPermissions,
      });
    } catch (e: any) {
      await handleError(getResponseType("requestPermissionsRequest"), e);
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
      const signature = await web3Deps?.signer.signMessage(message);

      // check for a valid response
      if (signature) {
        // return successful signature result
        await chrome.runtime.sendMessage({
          type: "signMessageResponse",
          response: signature,
        });
        return;
      }
    } catch (e: any) {
      // handle signing error and cancel the operation
      Logger.error(
        e,
        "Signature",
        "error signing personal message",
        hexEncodedMessage,
      );
    }

    // the message was not signed, return an error to caller
    await handleError(
      getResponseType("signMessageRequest"),
      new Error("personal message not signed"),
    );
  };

  const handleSignSolanaMessage = async () => {
    // retrieve encoded message
    const encodedMsg = fetcher.b64Decode(connectionStateMessage.params[0]);

    // TODO - send the message to backend API to be signed
    var decodedMsg = new TextDecoder().decode(encodedMsg);
    Logger.log(
      "Signing message",
      JSON.stringify({decodedMsg, encodedMsg}, undefined, 2),
    );

    // TODO - return actual signature once backend is available
    const signature = connectionStateMessage.params[0];
    await chrome.runtime.sendMessage({
      type: "signSolanaMessageResponse",
      response: signature,
    });
  };

  const handleSignTypedMessage = async (params: any[]) => {
    try {
      // validate there are at least two available parameter args
      if (params.length < 2) {
        await handleError(
          "signTypedMessageResponse",
          new Error(InvalidTypedMessageError),
        );
        return;
      }

      // the second request argument contains an encoded typed message, which
      // must be submitted for a signature request
      const signature = await web3Deps?.signer.signMessage(params[1]);
      if (signature) {
        await chrome.runtime.sendMessage({
          type: "signTypedMessageResponse",
          response: signature,
        });
        return;
      }
    } catch (e: any) {
      // handle signing error and cancel the operation
      Logger.error(e, "Signature", "error signing typed message", params);
    }

    // the message was not signed, return an error to caller
    await handleError(
      getResponseType("signTypedMessageRequest"),
      new Error("typed message not signed"),
    );
  };

  const handleSendTransaction = async (txParams: Record<string, string>) => {
    try {
      // prepare a transaction to be signed
      const txRequest: CreateTransaction = {
        chainId: parseInt(txParams.chainId, 10),
        to: txParams.to,
        data: txParams.data,
        value: txParams.value || "0",
      };

      // sign the transaction and return the hash, so the user
      // can be prompted to approve the transaction
      const txHash = await web3Deps?.signer.signTransaction(txRequest);
      await chrome.runtime.sendMessage({
        type: "sendTransactionResponse",
        response: txHash,
      });
    } catch (e: any) {
      // handle signing error and cancel the operation
      await handleError("sendTransactionResponse", e);
    }
  };

  const handleError = async (type: ResponseType, e: Error) => {
    // handle provider error and cancel the operation
    Logger.error(e, "Popup", "handled provider error", type);
    await chrome.runtime.sendMessage({
      type,
      error: String(e),
    });
    handleClose();
  };

  const handleCancel = async () => {
    await chrome.runtime.sendMessage({
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
      void handleError(
        getResponseType(message.type),
        new Error("user closed wallet"),
      );
    }
    return;
  };

  const renderButton = () => {
    // no work to do until a connection state is set
    if (!connectionState) {
      return;
    }

    // show error message if present
    if (errorMessage) {
      return (
        <Box mb={5}>
          <Alert severity="error">{errorMessage}</Alert>
        </Box>
      );
    }

    // render a confirmation button with different behavior depending on the
    // connection popup state
    return (
      <Button
        fullWidth
        variant="contained"
        disabled={!isLoaded || errorMessage !== undefined}
        onClick={
          CONNECT_ACCOUNT_STATES.includes(connectionState)
            ? handleConnectAccount
            : connectionState === ConnectionState.SOLANA_SIGN_MESSAGE
              ? handleSignSolanaMessage
              : connectionState === ConnectionState.PERMISSIONS
                ? handleRequestPermissions
                : undefined
        }
      >
        {CONNECT_ACCOUNT_STATES.includes(connectionState)
          ? t("common.connect")
          : t("wallet.approve")}
      </Button>
    );
  };

  // show wallet connect information
  return (
    <Paper className={classes.container}>
      <Box className={cx(classes.walletContainer, classes.contentContainer)}>
        {connectionState && RENDER_CONTENT_STATES.includes(connectionState) && (
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
                      : connectionState === ConnectionState.SOLANA_SIGN_MESSAGE
                        ? t("wallet.signMessageAction")
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
            {connectionState === ConnectionState.SOLANA_SIGN_MESSAGE && (
              <>
                <Typography mt={3} variant="body1">
                  {t("wallet.signMessageSubtitle")}:
                </Typography>
                <Box className={classes.messageContainer}>
                  <Markdown>
                    {new TextDecoder().decode(
                      fetcher.b64Decode(connectionStateMessage.params[0]),
                    )}
                  </Markdown>
                </Box>
              </>
            )}
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
