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
} from "../../types/wallet";
import config, {WINDOW_PROPERTY_NAME, LOGO_BASE_64} from "../../config";
import {EthereumProviderError} from "eth-rpc-errors";
import {ExternalProvider} from "@ethersproject/providers";
import {Mutex} from "async-mutex";
import {EventEmitter} from "events";
import {announceProvider} from "../../util/wallet/eip6963";
import {MetaMaskInpageProvider, shimWeb3} from "@metamask/providers";
import {sleep} from "../../util/wallet/sleep";

let cachedAccountAddress = null;
let cachedAccountChainId = null;

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
  isStatus?: boolean;
  host?: string;
  path?: string;

  // unused properties, but required to be present in order to properly
  // emulate MetaMask in the case the user wants maximum compatibility
  chainId: string | null;
  networkVersion: string | null;
  selectedAddress: string | null;
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

  constructor(overrideMetaMask?: boolean) {
    super();
    this.isMetaMask = overrideMetaMask || false;
    this.mutex = new Mutex();
    this.pendingRequests = 0;

    // print a message to indicate the extension is loaded
    console.log("Unstoppable Domains Lite Wallet extension loaded");
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
    console.log("Request received", JSON.stringify({method, params}));
    try {
      let result: any;
      switch (method) {
        // Wallet connection methods
        case "eth_requestAccounts":
          result = await this.handleAccountRequest();
          break;
        case "eth_chainId":
          result = await this.handleChainIdRequest();
          break;
        case "eth_accounts":
          result = await this.handleAccountRequest();
          break;
        case "wallet_requestPermissions":
          result = await this.handleRequestPermissions(params);
          break;
        case "wallet_switchEthereumChain":
          result = await this.handleSwitchChain(params);
          break;
        // Message signing methods
        case "personal_sign":
          result = await this.handlePersonalSign(params);
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
      console.log("Request successful", JSON.stringify({method, result}));
      return result;
    } catch (error) {
      // result is failure
      console.log("Request failed", {method, error});
      throw error;
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

  /******************
   * Internal methods
   ******************/

  private emitEvent(type: Eip1193Event, data: unknown) {
    this.emit(type, data);
  }

  private handleClosePopup() {
    document.dispatchEvent(new ProviderEvent("closeWindowRequest"));
  }

  private handleConnected(account: ProviderAccountResponse) {
    cachedAccountAddress = account.address;
    cachedAccountChainId = account.chainId;
    this.isStatus = true;
  }

  private async handleAccountRequest() {
    if (cachedAccountAddress) {
      return [cachedAccountAddress];
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
            this.handleConnected(event.detail);
            this.emitEvent("accountsChanged", [event.detail.address]);
            this.emitEvent("connect", {chainId: event.detail.chainId});

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

  private async handleChainIdRequest() {
    if (cachedAccountChainId) {
      return cachedAccountChainId;
    }

    // connect to chain ID
    return await new Promise((resolve, reject) => {
      document.dispatchEvent(new ProviderEvent("selectChainIdRequest"));
      this.addEventListener(
        "selectChainIdResponse",
        (event: ProviderResponse) => {
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
            this.emitEvent("connect", {chainId: event.detail.chainId});
            this.emitEvent("chainChanged", event.detail.chainId);

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
            this.handleConnected(event.detail);
            this.emitEvent("chainChanged", event.detail.chainId);

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

  private async handleSendTransaction(params: any[]) {
    return await new Promise((resolve, reject) => {
      //validate an account is connected
      if (!cachedAccountAddress || !cachedAccountChainId) {
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
      normalizedParams.chainId = String(cachedAccountChainId);

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
            this.handleConnected(event.detail);
            this.emitEvent("connect", {chainId: event.detail.chainId});
            this.emitEvent("accountsChanged", [event.detail.address]);

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

// EIP-1193: attach the provider to global window object
// as window.unstoppable by default
window[WINDOW_PROPERTY_NAME] = proxyProvider;
if (provider.isMetaMask) {
  // Optionally override the window.ethereum global property if the
  // provider is created with the metamask flag. Initializing the
  // extension in this way can interfere with other extensions and
  // make the inaccessible to the user.
  window.ethereum = proxyProvider;
}
window.dispatchEvent(new Event("ethereum#initialized"));

// EIP-6963: announce the provider
announceProvider({
  info: {
    icon: `data:image/png;base64,${LOGO_BASE_64}`,
    ...config.extension,
  },
  provider: proxyProvider,
});

// Backwards compatibility for legacy connections
shimWeb3(proxyProvider as unknown as MetaMaskInpageProvider);
