import {
  ProviderResponse,
  UnexpectedResponseError,
  ProviderMethod,
  ProviderEvent,
  ResponseType,
  InvalidSwitchChainError,
  ProviderAccountResponse,
  Eip1193Event,
  InvalidTxError,
  NotConnectedError,
  InvalidSignatureError,
  PROVIDER_CODE_USER_ERROR,
  PROVIDER_CODE_NOT_IMPLEMENTED,
  UnsupportedMethodError,
  InvalidTypedMessageError,
} from "../../types/wallet/provider";
import config, {WINDOW_PROPERTY_NAME, LOGO_BASE_64} from "../../config";
import {EthereumProviderError} from "eth-rpc-errors";
import {ExternalProvider} from "@ethersproject/providers";
import {Mutex} from "async-mutex";
import {EventEmitter} from "events";
import {announceProvider} from "../../lib/wallet/evm/eip6963";
import {MetaMaskInpageProvider, shimWeb3} from "@metamask/providers";
import {EIP_712_KEY, TypedMessage} from "../../types/wallet/eip712";
import {Logger} from "../../lib/logger";
import {WalletPreferences} from "../../types/wallet/preferences";
import {retryAsync, waitUntilAsync} from "ts-retry";

declare global {
  interface Window {
    [WINDOW_PROPERTY_NAME]: ExternalProvider;
    ethereum?: ExternalProvider;
  }
}

interface RequestArgs {
  method: ProviderMethod;
  params: any[];
}

class LiteWalletProvider extends EventEmitter {
  // web3 provider properties
  isMetaMask: boolean;
  isConnectedStatus: boolean;
  chainId: string | null;
  networkVersion: string | null;
  selectedAddress: string | null;

  // unused properties, but required to be present in order to properly
  // emulate MetaMask in the case the user wants maximum compatibility
  _metamask = {
    isUnlocked: (): Promise<boolean> => {
      return new Promise((resolve) => {
        resolve(true);
      });
    },
  };

  // internal properties
  private mutex: Mutex;
  private pendingRequests: number;

  /*************************
   * Public provider methods
   *************************/

  constructor() {
    super();
    this.isMetaMask = true;
    this.isConnectedStatus = false;
    this.mutex = new Mutex();
    this.pendingRequests = 0;
  }

  // represents the extension is available for requests, not necessarily an
  // approved connection to a specific wallet
  isConnected(): boolean {
    return true;
  }

  // primary method used to make requests to the wallet extension
  async request({method, params}: RequestArgs) {
    // Serialize operation requests, waiting for completion before moving on
    // to subsequent operations. Keep track of the number of queued requests,
    // which will determine window close behavior.
    this.pendingRequests++;
    const unlock = await this.mutex.acquire();

    // request is no longer pending
    this.pendingRequests--;

    // process the provider request
    Logger.log("Request received", JSON.stringify({method, params}));
    try {
      let result: any;
      switch (method) {
        // Wallet connection methods
        case "eth_chainId":
          // requests current chain ID
          result = await this.handleGetConnectedChainIds();
          break;
        case "eth_accounts":
          // requires a previous connection to be established
          result = await this.handleGetConnectedAccounts();
          break;
        case "eth_requestAccounts":
          // retrieves connected account list, and requests a permission
          // to connect if not yet completed.
          result = await this.handleRequestAccounts();
          break;
        case "wallet_requestPermissions":
          // requests permission to connect to the wallet, similar to the
          // above call to eth_requestAccounts but with different return
          // format and user experience.
          result = await this.handleRequestPermissions(params);
          break;
        case "wallet_switchEthereumChain":
          // request to change network ID for subsequent operations, and
          // returns an error if network is not supported.
          result = await this.handleSwitchChain(params);
          break;
        // Message signing methods
        case "personal_sign":
          result = await this.handlePersonalSign(params);
          break;
        case "eth_signTypedData_v4":
          result = await this.handleTypedSign(params);
          break;
        // Transaction methods
        case "eth_sendTransaction":
          result = await this.handleSendTransaction(params);
          break;
        case "eth_getTransactionByHash":
          // not implemented, but stubbed out with "not found" to prevent runtime
          // errors on apps that call this method
          result = null;
          break;
        default:
          throw new EthereumProviderError(
            PROVIDER_CODE_NOT_IMPLEMENTED,
            `Unsupported method: ${method}`,
          );
      }

      // result is successful
      Logger.log("Request successful", JSON.stringify({method, result}));
      return result;
    } catch (e) {
      // result is failure
      Logger.error(e, "Popup", "Request failed", method, params);
      throw e;
    } finally {
      // close the window if no pending requests remain
      if (!this.pendingRequests) {
        this.handleClosePopup();
      }

      // release the lock
      unlock();
    }
  }

  // deprecated legacy method, but must be present to be properly detected by some
  // provider libraries that are still in use
  sendAsync(
    payload: any,
    _callback: (error: Error | null, result?: any) => void,
  ): void {
    throw new EthereumProviderError(
      PROVIDER_CODE_NOT_IMPLEMENTED,
      UnsupportedMethodError,
    );
  }

  /*************************
   * Public custom methods
   *************************/

  async getPreferences(): Promise<WalletPreferences> {
    const fetcher = () =>
      new Promise<WalletPreferences>((resolve, reject) => {
        document.dispatchEvent(new ProviderEvent("getPreferencesRequest"));
        this.addEventListener(
          "getPreferencesResponse",
          (event: ProviderResponse) => {
            if (event.detail.error) {
              reject(
                new EthereumProviderError(
                  PROVIDER_CODE_USER_ERROR,
                  event.detail.error,
                ),
              );
            } else if ("preferences" in event.detail) {
              resolve(event.detail.preferences);
            } else {
              reject(
                new EthereumProviderError(
                  PROVIDER_CODE_USER_ERROR,
                  UnexpectedResponseError,
                ),
              );
            }
          },
        );
      });

    // retrieve preferences with retry support
    return await this.withRetry(fetcher);
  }

  /******************
   * Internal methods
   ******************/

  private emitEvent(type: Eip1193Event, data: unknown) {
    this.emit(type, data);
  }

  private async withRetry<T>(fn: () => Promise<T>, maxTry = 10): Promise<T> {
    // Retry several times to ensure listeners are available when the page first
    // loads. There is a race condition where a listener method is called during
    // page load, but the extension listeners are not fully loaded. The retry will
    // allow the page load to continue and retrieve the data as expected after
    // a short wait.
    return await retryAsync(async () => await waitUntilAsync(fn, 500), {
      delay: 100,
      maxTry,
    });
  }

  private handleClosePopup() {
    document.dispatchEvent(new ProviderEvent("closeWindowRequest"));
  }

  private handleConnected(
    account: ProviderAccountResponse,
    emitEvents?: Eip1193Event[],
  ) {
    // cache the selected account and chain ID
    this.selectedAddress = account.address;
    this.chainId = `0x${account.chainId}`;
    this.networkVersion = String(account.chainId);
    this.isConnectedStatus = true;

    // handle any requested events
    emitEvents?.map((event) => {
      switch (event) {
        case "accountsChanged":
          this.emitEvent("accountsChanged", [this.selectedAddress]);
          break;
        case "connect":
          this.emitEvent("connect", {chainId: this.networkVersion});
          break;
        case "chainChanged":
          this.emitEvent("chainChanged", this.networkVersion);
          break;
      }
    });
  }

  private async handleGetConnectedAccounts() {
    if (this.selectedAddress) {
      return [this.selectedAddress];
    }

    // a method to retrieve account data
    const fetcher = () =>
      new Promise<string>((resolve, reject) => {
        document.dispatchEvent(new ProviderEvent("accountRequest"));
        this.addEventListener("accountResponse", (event: ProviderResponse) => {
          if (event.detail.error) {
            reject(
              new EthereumProviderError(
                PROVIDER_CODE_USER_ERROR,
                event.detail.error,
              ),
            );
          } else if ("address" in event.detail) {
            // handle success events
            this.handleConnected(event.detail);

            // resolve the promise
            resolve(event.detail.address);
          } else {
            reject(
              new EthereumProviderError(
                PROVIDER_CODE_USER_ERROR,
                UnexpectedResponseError,
              ),
            );
          }
        });
      });

    // wait for account data
    const address = await this.withRetry(fetcher);

    // return list of accounts
    return [address];
  }

  private async handleGetConnectedChainIds() {
    if (this.networkVersion) {
      return this.networkVersion;
    }

    // a method to retrieve chain ID data
    const fetcher = () =>
      new Promise<number>((resolve, reject) => {
        document.dispatchEvent(new ProviderEvent("chainIdRequest"));
        this.addEventListener("chainIdResponse", (event: ProviderResponse) => {
          if (event.detail.error) {
            reject(
              new EthereumProviderError(
                PROVIDER_CODE_USER_ERROR,
                event.detail.error,
              ),
            );
          } else if ("chainId" in event.detail) {
            // handle success events
            this.handleConnected(event.detail);

            // resolve the promise
            resolve(event.detail.chainId);
          } else {
            reject(
              new EthereumProviderError(
                PROVIDER_CODE_USER_ERROR,
                UnexpectedResponseError,
              ),
            );
          }
        });
      });

    // wait for chain ID
    const chainId = await this.withRetry(fetcher);

    // return the chain ID
    return String(chainId);
  }

  private async handleRequestAccounts() {
    if (this.selectedAddress) {
      return [this.selectedAddress];
    }

    // connect to account
    const accountResponse = new Promise((resolve, reject) => {
      document.dispatchEvent(new ProviderEvent("selectAccountRequest"));
      this.addEventListener(
        "selectAccountResponse",
        (event: ProviderResponse) => {
          if (event.detail.error) {
            reject(
              new EthereumProviderError(
                PROVIDER_CODE_USER_ERROR,
                event.detail.error,
              ),
            );
          } else if ("address" in event.detail) {
            // handle success events
            this.handleConnected(event.detail, ["connect", "accountsChanged"]);

            // resolve the promise
            resolve(event.detail.address);
          } else {
            reject(
              new EthereumProviderError(
                PROVIDER_CODE_USER_ERROR,
                UnexpectedResponseError,
              ),
            );
          }
        },
      );
    });

    // return list of accounts
    return [await accountResponse];
  }

  private async handleRequestPermissions(params: any[]) {
    return await new Promise((resolve, reject) => {
      document.dispatchEvent(
        new ProviderEvent("requestPermissionsRequest", {
          detail: params,
        }),
      );
      this.addEventListener(
        "requestPermissionsResponse",
        (event: ProviderResponse) => {
          if (event.detail.error) {
            reject(
              new EthereumProviderError(
                PROVIDER_CODE_USER_ERROR,
                event.detail.error,
              ),
            );
          } else if ("address" in event.detail) {
            // handle success events
            this.handleConnected(event.detail, ["connect", "accountsChanged"]);

            // resolve the promise
            resolve(event.detail.permissions);
          } else {
            reject(
              new EthereumProviderError(
                PROVIDER_CODE_USER_ERROR,
                UnexpectedResponseError,
              ),
            );
          }
        },
      );
    });
  }

  private async handleSwitchChain(params: any[]) {
    // determine the requested chain ID
    if (!params || !params.length) {
      throw new EthereumProviderError(
        PROVIDER_CODE_USER_ERROR,
        InvalidSwitchChainError,
      );
    }
    const requestedChainId = params[0].chainId;
    if (!requestedChainId) {
      throw new EthereumProviderError(
        PROVIDER_CODE_USER_ERROR,
        InvalidSwitchChainError,
      );
    }

    // attempt to switch to the new chain ID, or throw an error
    // if the chain is not available
    await new Promise((resolve, reject) => {
      document.dispatchEvent(
        new ProviderEvent("switchChainRequest", {
          detail: [{chainId: requestedChainId}],
        }),
      );
      this.addEventListener(
        "switchChainResponse",
        (event: ProviderResponse) => {
          if (event.detail.error) {
            reject(
              new EthereumProviderError(
                PROVIDER_CODE_USER_ERROR,
                event.detail.error,
              ),
            );
          } else if ("address" in event.detail) {
            // handle success events
            this.handleConnected(event.detail, ["chainChanged"]);

            // resolve the promise
            resolve(event.detail.chainId);
          } else {
            reject(
              new EthereumProviderError(
                PROVIDER_CODE_USER_ERROR,
                UnexpectedResponseError,
              ),
            );
          }
        },
      );
    });
  }

  private async handlePersonalSign(params: any[]) {
    return await new Promise((resolve, reject) => {
      // validate the provided parameters include a string in hex format
      // that can be signed
      if (!params || params.length === 0) {
        throw new EthereumProviderError(
          PROVIDER_CODE_USER_ERROR,
          InvalidSignatureError,
        );
      }
      const messageToSign = params[0];
      if (
        typeof messageToSign !== "string" ||
        !messageToSign.startsWith("0x")
      ) {
        throw new EthereumProviderError(
          PROVIDER_CODE_USER_ERROR,
          InvalidSignatureError,
        );
      }

      // send the message signing event
      document.dispatchEvent(
        new ProviderEvent("signMessageRequest", {
          // parameters are expected to be sent as first element of
          // the detail array
          detail: [messageToSign],
        }),
      );
      this.addEventListener(
        "signMessageResponse",
        (event: ProviderResponse) => {
          if (event.detail.error) {
            reject(
              new EthereumProviderError(
                PROVIDER_CODE_USER_ERROR,
                event.detail.error,
              ),
            );
          } else if ("response" in event.detail) {
            resolve(event.detail.response);
          } else {
            reject(
              new EthereumProviderError(
                PROVIDER_CODE_USER_ERROR,
                UnexpectedResponseError,
              ),
            );
          }
        },
      );
    });
  }

  private async handleTypedSign(params: any[]) {
    return await new Promise((resolve, reject) => {
      // validate the provided parameters contain at least two elements,
      // the first being an address, and the second being a typed message
      if (!params || params.length < 0) {
        throw new EthereumProviderError(
          PROVIDER_CODE_USER_ERROR,
          InvalidTypedMessageError,
        );
      }

      // validate the first element is an ethereum address
      if (!params[0].startsWith("0x")) {
        Logger.error(
          new Error(
            "first element of typed message parameters must be an Ethereum address",
          ),
          "Popup",
          params[0],
        );
        throw new EthereumProviderError(
          PROVIDER_CODE_USER_ERROR,
          InvalidTypedMessageError,
        );
      }

      // validate the second element contains an EIP-712 identifier
      if (!params[1].includes(EIP_712_KEY)) {
        Logger.error(
          new Error(
            "second element of typed message parameters must an EIP-712 message",
          ),
          "Popup",
          params[1],
        );
        throw new EthereumProviderError(
          PROVIDER_CODE_USER_ERROR,
          InvalidTypedMessageError,
        );
      }

      // parse the second element to ensure it matches EIP-712 format
      try {
        const parsedMessage: TypedMessage = JSON.parse(params[1]);
        if (!parsedMessage?.domain?.name || !parsedMessage.message) {
          throw new Error("invalid EIP-712 message format");
        }
      } catch (e) {
        Logger.error(
          new Error("invalid fields in EIP-712 message"),
          "Popup",
          params[1],
        );
        throw new EthereumProviderError(
          PROVIDER_CODE_USER_ERROR,
          InvalidTypedMessageError,
        );
      }

      // send the typed message signing event
      document.dispatchEvent(
        new ProviderEvent("signTypedMessageRequest", {
          detail: params,
        }),
      );
      this.addEventListener(
        "signTypedMessageResponse",
        (event: ProviderResponse) => {
          if (event.detail.error) {
            reject(
              new EthereumProviderError(
                PROVIDER_CODE_USER_ERROR,
                event.detail.error,
              ),
            );
          } else if ("response" in event.detail) {
            resolve(event.detail.response);
          } else {
            reject(
              new EthereumProviderError(
                PROVIDER_CODE_USER_ERROR,
                UnexpectedResponseError,
              ),
            );
          }
        },
      );
    });
  }

  private async handleSendTransaction(params: any[]) {
    return await new Promise((resolve, reject) => {
      //validate an account is connected
      if (!this.selectedAddress || !this.networkVersion) {
        throw new EthereumProviderError(
          PROVIDER_CODE_USER_ERROR,
          NotConnectedError,
        );
      }

      // validate any Tx parameters have been passed
      if (!params || params.length === 0) {
        throw new EthereumProviderError(
          PROVIDER_CODE_USER_ERROR,
          InvalidTxError,
        );
      }

      // validate repackage the transaction parameters to include
      // the currently connected chain ID. This will be needed by
      // the extension popup to complete the signature.
      const normalizedParams = params[0];
      if (!normalizedParams.data || !normalizedParams.to) {
        throw new EthereumProviderError(
          PROVIDER_CODE_USER_ERROR,
          InvalidTxError,
        );
      }
      normalizedParams.chainId = this.networkVersion;

      // send the prepared transaction signing event
      document.dispatchEvent(
        new ProviderEvent("sendTransactionRequest", {
          // parameters are expected to be sent as first element of
          // the detail array
          detail: [normalizedParams],
        }),
      );
      this.addEventListener(
        "sendTransactionResponse",
        (event: ProviderResponse) => {
          if (event.detail.error) {
            reject(
              new EthereumProviderError(
                PROVIDER_CODE_USER_ERROR,
                event.detail.error,
              ),
            );
          } else if ("response" in event.detail) {
            resolve(event.detail.response);
          } else {
            reject(
              new EthereumProviderError(
                PROVIDER_CODE_USER_ERROR,
                UnexpectedResponseError,
              ),
            );
          }
        },
      );
    });
  }

  private addEventListener(
    eventType: ResponseType,
    listener: (event: ProviderResponse) => void,
  ) {
    document.addEventListener(eventType, listener);
  }
}

// create a wallet provider object
const provider = new LiteWalletProvider();
const proxyProvider = new Proxy(provider, {
  deleteProperty: () => true,
});

// EIP-6963: announce the provider
announceProvider({
  info: {
    icon: `data:image/png;base64,${LOGO_BASE_64}`,
    ...config.extension,
  },
  provider: proxyProvider,
});
Logger.log("Announced Ethereum provider");

// EIP-1193: attach the provider to global window object
// as window.unstoppable by default
window[WINDOW_PROPERTY_NAME] = proxyProvider;
Logger.log("Injected Ethereum provider", `window.${WINDOW_PROPERTY_NAME}`);

// Optionally override the window.ethereum global property if the
// provider is created with the metamask flag. Initializing the
// extension in this way can interfere with other extensions and
// make the inaccessible to the user.
provider.getPreferences().then((walletPreferences) => {
  if (walletPreferences.OverrideMetamask) {
    window.ethereum = proxyProvider;
    Logger.log("Injected Ethereum provider", "window.ethereum");
  }
  window.dispatchEvent(new Event("ethereum#initialized"));
});

// Backwards compatibility for legacy connections
shimWeb3(proxyProvider as unknown as MetaMaskInpageProvider);
