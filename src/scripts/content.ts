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
} from "../types/wallet";
import {EthereumProviderError} from "eth-rpc-errors";
import {ExternalProvider} from "@ethersproject/providers";
import {Mutex} from "async-mutex";
import {EventEmitter} from "events";

let cachedAccountAddress = null;
let cachedAccountChainId = null;

declare global {
  interface Window {
    ethereum?: ExternalProvider;
  }
}

interface RequestArgs {
  method: ProviderMethod;
  params: any[];
}

class CustomWalletProvider extends EventEmitter {
  // web3 provider properties
  isMetaMask?: boolean;
  isStatus?: boolean;
  host?: string;
  path?: string;

  // internal properties
  private mutex: Mutex;

  /*************************
   * Public provider methods
   *************************/

  constructor() {
    super();
    this.isMetaMask = true;
    this.mutex = new Mutex();
    this.shimLegacy();

    // print a message to indicate the extension is loaded
    console.log("Unstoppable Domains Lite Wallet extension loaded");
  }

  isConnected(): boolean {
    return this.isStatus === true;
  }

  async request({method, params}: RequestArgs) {
    // serialize operation requests, waiting for completion before moving on
    // to subsequent operations
    const unlock = await this.mutex.acquire();

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
      // release the lock
      unlock();
    }
  }

  /******************
   * Internal methods
   ******************/

  private shimLegacy() {
    const legacyMethods = [
      ["enable", "eth_requestAccounts"],
      ["net_version", "net_version"],
    ];

    for (const [_method, method] of legacyMethods) {
      this[_method] = () =>
        this.request({method: method as ProviderMethod, params: [{}]});
    }
  }

  private emitEvent(type: Eip1193Event, data: unknown) {
    this.emit(type, data);
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

// attach the custom wallet provider to window.ethereum
const provider = new CustomWalletProvider();
window.ethereum = provider;

export default {
  currentProvider: new Proxy(provider, {
    deleteProperty: () => true,
  }),
};
