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
  ClientSideMessageTypes,
  isClientSideRequestType,
  ProviderMethodsWithPrompt,
} from "../../types/wallet/provider";
import {clone} from "lodash";
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
import {utils as web3utils} from "web3";
import {ResolutionData} from "../../lib/sherlock/types";
import {SerializedPublicDomainProfileData} from "@unstoppabledomains/ui-components";
import {LRUCache} from "lru-cache";
import {isEthAddress} from "../../lib/sherlock/matcher";

declare global {
  interface Window {
    [WINDOW_PROPERTY_NAME]: LiteWalletProvider;
    ethereum?: ExternalProvider;
  }
}

interface RequestArgs {
  method: ProviderMethod;
  params: any[];
  result?: any;
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
  private requestQueue: RequestArgs[];
  private lastCompletedRequest: RequestArgs;
  private lruCache = new LRUCache<string, any>({
    max: 100,
    ttl: 60 * 1000 * 30, // 30 minutes
  });

  /*************************
   * Public provider methods
   *************************/

  constructor() {
    super();
    this.init();
  }

  private init() {
    this.isMetaMask = true;
    this.isConnectedStatus = false;
    this.mutex = new Mutex();
    this.lastCompletedRequest = null;
    this.chainId = null;
    this.networkVersion = null;
    this.selectedAddress = null;
    this.requestQueue = [];
  }

  // represents the extension is available for requests, not necessarily an
  // approved connection to a specific wallet
  isConnected(): boolean {
    return true;
  }

  // primary method used to make requests to the wallet extension
  async request(request: RequestArgs) {
    // queue the incoming request
    Logger.log("Request queued", JSON.stringify(request));
    this.requestQueue.push(request);

    // set the badge count
    this.handleQueueUpdate(this.uniqueRequestCount(ProviderMethodsWithPrompt));

    // Serialize operation requests, waiting for completion before moving on
    // to subsequent operations. Keep track of the number of queued requests,
    // which will determine window close behavior.
    const unlock = await this.mutex.acquire();

    // eventual result
    let result: any;

    // process the provider request
    Logger.log("Request processing", JSON.stringify(request));
    try {
      // check for duplicate request and return previous answer
      if (this.isDuplicateRequest(request)) {
        Logger.warn(
          "Request duplicate detected",
          JSON.stringify({request, result: this.lastCompletedRequest.result}),
        );
        result = this.lastCompletedRequest.result;
        return result;
      }

      switch (request.method) {
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
          result = await this.handleRequestPermissions(clone(request.params));
          break;
        case "wallet_switchEthereumChain":
          // request to change network ID for subsequent operations, and
          // returns an error if network is not supported.
          result = await this.handleSwitchChain(clone(request.params));
          break;
        // Message signing methods
        case "personal_sign":
          result = await this.handlePersonalSign(clone(request.params));
          break;
        case "eth_signTypedData_v4":
          result = await this.handleTypedSign(clone(request.params));
          break;
        // Transaction methods
        case "eth_sendTransaction":
          result = await this.handleSendTransaction(clone(request.params));
          break;
        case "eth_getTransactionByHash":
          // not implemented, but stubbed out with "not found" to prevent runtime
          // errors on apps that call this method
          result = null;
          break;
        default:
          throw new EthereumProviderError(
            PROVIDER_CODE_NOT_IMPLEMENTED,
            `Unsupported method: ${request.method}`,
          );
      }

      // result is successful
      Logger.log(
        "Request successful",
        JSON.stringify({method: request.method, result}),
      );
      return result;
    } catch (e) {
      // result is failure
      Logger.error(e, "Popup", "Request failed", JSON.stringify(request));
      throw e;
    } finally {
      // remove the first element from the request service queue
      this.requestQueue.shift();
      this.lastCompletedRequest = request;
      this.lastCompletedRequest.result = result;

      // determine the number of remaining requests
      this.handleQueueUpdate(
        this.uniqueRequestCount(ProviderMethodsWithPrompt),
      );

      // close the window if no unique pending requests remain
      if (this.uniqueRequestCount() === 0) {
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

  // disconnect raises a disconnect event to the app
  async requestDisconnect() {
    this.init();
    this.emitEvent("disconnect", {});
    Logger.log("Disconnected from app");
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

  async getDomainProfile(
    domain: string,
  ): Promise<SerializedPublicDomainProfileData | undefined> {
    // check from cache
    const cacheKey = `getDomainProfile-${domain.toLowerCase()}`;
    const cachedValue = this.lruCache.get(cacheKey);
    if (cachedValue) {
      return cachedValue;
    }

    // allow one profile request at a time
    return await this.mutex.runExclusive(async () => {
      // retrieve the domain profile data
      return await new Promise<SerializedPublicDomainProfileData>(
        (resolve, reject) => {
          document.dispatchEvent(
            new ProviderEvent("getDomainProfileRequest", {detail: [domain]}),
          );
          this.addEventListener(
            "getDomainProfileResponse",
            (event: ProviderResponse) => {
              if (event.detail.error) {
                reject(
                  new EthereumProviderError(
                    PROVIDER_CODE_USER_ERROR,
                    event.detail.error,
                  ),
                );
              } else if ("profile" in event.detail) {
                this.lruCache.set(cacheKey, event.detail.profile);
                resolve(event.detail.profile);
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
        },
      );
    });
  }

  async getResolution(
    addressOrName: string,
  ): Promise<ResolutionData | undefined> {
    // check from cache
    const cacheKey = `getResolution-${addressOrName.toLowerCase()}`;
    const cachedValue = this.lruCache.get(cacheKey);
    if (cachedValue) {
      return isEthAddress(cachedValue.address) ? cachedValue : undefined;
    }

    // allow one resolution at a time
    return await this.mutex.runExclusive(async () => {
      // retrieve the resolution data
      return await new Promise<ResolutionData>((resolve, reject) => {
        document.dispatchEvent(
          new ProviderEvent("getResolutionRequest", {detail: [addressOrName]}),
        );
        this.addEventListener(
          "getResolutionResponse",
          (event: ProviderResponse) => {
            if (event.detail.error) {
              reject(
                new EthereumProviderError(
                  PROVIDER_CODE_USER_ERROR,
                  event.detail.error,
                ),
              );
            } else if ("domain" in event.detail) {
              // cache value and return
              const resolution = {
                address: event.detail.address,
                domain: event.detail.domain,
                avatar: event.detail.avatar,
              };
              this.lruCache.set(cacheKey, resolution);
              resolve(resolution);
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
    });
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

  private isDuplicateRequest(request: RequestArgs) {
    // only if there was already a completed request
    if (!this.lastCompletedRequest) {
      return false;
    }

    // prepare a comparison request
    const lastRequest = {
      method: this.lastCompletedRequest.method,
      params: this.lastCompletedRequest.params,
    };
    return (
      this.lastCompletedRequest?.result &&
      JSON.stringify(request) === JSON.stringify(lastRequest)
    );
  }

  private async isAddressInAccount(address: string) {
    const allAddresses = await this.handleGetConnectedAccounts();
    return (
      allAddresses.find((a) => a.toLowerCase() === address.toLowerCase()) !==
      undefined
    );
  }

  private uniqueRequestCount(filter?: ProviderMethod[]) {
    return this.requestQueue.filter(
      (r) =>
        !this.isDuplicateRequest(r) && (!filter || filter.includes(r.method)),
    ).length;
  }

  private handleQueueUpdate(count: number) {
    document.dispatchEvent(
      new ProviderEvent("queueRequest", {detail: [count]}),
    );
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
          } else if ("chainId" in event.detail) {
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
          } else if ("chainId" in event.detail) {
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
          } else if ("chainId" in event.detail) {
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
    return await new Promise((resolve, reject) => {
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
          } else if ("chainId" in event.detail) {
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
    // validate the provided parameters include a string in hex format
    // that can be signed
    if (!params || params.length === 0) {
      throw new EthereumProviderError(
        PROVIDER_CODE_USER_ERROR,
        InvalidSignatureError,
      );
    }
    const messageParam = params[0];
    if (typeof messageParam !== "string") {
      throw new EthereumProviderError(
        PROVIDER_CODE_USER_ERROR,
        InvalidSignatureError,
      );
    }

    // Convert ASCII to hex if not already completed. The client should
    // have already done this, but we have seen cases where plain text is
    // passed to the wallet directly. Doing this conversion saves an the
    // user from encountering an error.
    const messageToSign = messageParam.startsWith("0x")
      ? messageParam
      : web3utils.asciiToHex(messageParam);

    // if a second address parameter is provided, verify that it matches
    // the connected account
    if (params.length > 1 && params[1].startsWith("0x")) {
      const isValid = await this.isAddressInAccount(params[1]);
      if (!isValid) {
        throw new EthereumProviderError(
          PROVIDER_CODE_USER_ERROR,
          NotConnectedError,
        );
      }
    }

    return await new Promise((resolve, reject) => {
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

    // validate the provided address is found in the connected account
    const isAddressValid = await this.isAddressInAccount(params[0]);
    if (!isAddressValid) {
      Logger.error(
        new Error("address not found in Lite Wallet account"),
        "Popup",
        params[0],
      );
      throw new EthereumProviderError(
        PROVIDER_CODE_USER_ERROR,
        NotConnectedError,
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

    return await new Promise((resolve, reject) => {
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
    //validate an account is connected
    if (!this.selectedAddress || !this.networkVersion) {
      throw new EthereumProviderError(
        PROVIDER_CODE_USER_ERROR,
        NotConnectedError,
      );
    }

    // validate any Tx parameters have been passed
    if (!params || params.length === 0) {
      throw new EthereumProviderError(PROVIDER_CODE_USER_ERROR, InvalidTxError);
    }

    // validate repackage the transaction parameters to include
    // the currently connected chain ID. This will be needed by
    // the extension popup to complete the signature.
    const normalizedParams = params[0];
    if (!normalizedParams.data || !normalizedParams.to) {
      throw new EthereumProviderError(PROVIDER_CODE_USER_ERROR, InvalidTxError);
    }
    normalizedParams.chainId = this.networkVersion;

    return await new Promise((resolve, reject) => {
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
    const listenerWrapper = (event: ProviderResponse) => {
      document.removeEventListener(eventType, listenerWrapper);
      listener(event);
    };
    document.addEventListener(eventType, listenerWrapper);
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

// listen for events that should be handled by the provider
ClientSideMessageTypes.map((messageType) => {
  document.addEventListener(messageType, () => {
    if (isClientSideRequestType(messageType)) {
      switch (messageType) {
        case "refreshRequest":
          window.location.reload();
          break;
        case "disconnectRequest":
          if (window.unstoppable) {
            void window.unstoppable.requestDisconnect();
          }
          break;
      }
    }
  });
});
