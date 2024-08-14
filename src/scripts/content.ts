import {
  ProviderResponse,
  UnexpectedResponseError,
  ProviderMethod,
  ProviderEvent,
  ResponseType,
} from "../types/wallet";
import {ExternalProvider} from "@ethersproject/providers";

let cachedAccountAddress = null;
let cachedAccountChainId = null;

declare global {
  interface Window {
    ethereum?: ExternalProvider;
  }
}

interface RequestArgs {
  method: ProviderMethod;
  params: any;
}

class CustomWalletProvider {
  isMetaMask: boolean;

  constructor() {
    this.isMetaMask = true;
  }

  async request({method, params}: RequestArgs) {
    console.log("Request received", {method, params});

    let result: any;
    try {
      switch (method) {
        case "eth_requestAccounts":
          result = await this.handleAccountRequest();
          break;
        case "eth_chainId":
          result = await this.handleChainIdRequest();
          break;
        case "eth_accounts":
          result = await this.handleAccountRequest();
          break;
        case "personal_sign":
          result = await this.handlePersonalSign(params);
          break;
        case "wallet_requestPermissions":
          result = await this.handleRequestPermissions(params);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      console.log("Request successful", {method, result});
      return result;
    } catch (error) {
      console.log("Request failed", {method, error});
      throw error;
    }
  }

  async handleAccountRequest() {
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
            reject(event.detail.error);
          } else if ("address" in event.detail) {
            cachedAccountAddress = event.detail.address;
            cachedAccountChainId = event.detail.chainId;
            resolve(event.detail.address);
          } else {
            reject(UnexpectedResponseError);
          }
        },
      );
    });

    // return list of accounts
    return [await accountResponse];
  }

  async handleChainIdRequest() {
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
            reject(event.detail.error);
          } else if ("chainId" in event.detail) {
            resolve(event.detail.chainId);
          } else {
            reject(UnexpectedResponseError);
          }
        },
      );
    });
  }

  async handlePersonalSign(params: any) {
    return await new Promise((resolve, reject) => {
      document.dispatchEvent(
        new ProviderEvent("signMessageRequest", {
          detail: params,
        }),
      );
      this.addEventListener(
        "signMessageResponse",
        (event: ProviderResponse) => {
          if (event.detail.error) {
            reject(event.detail.error);
          } else if ("response" in event.detail) {
            resolve(event.detail.response);
          } else {
            reject(UnexpectedResponseError);
          }
        },
      );
    });
  }

  async handleRequestPermissions(params: any) {
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
            reject(event.detail.error);
          } else if ("address" in event.detail) {
            cachedAccountAddress = event.detail.address;
            cachedAccountChainId = event.detail.chainId;
            resolve(event.detail.permissions);
          } else {
            reject(UnexpectedResponseError);
          }
        },
      );
    });
  }

  addEventListener(
    eventType: ResponseType,
    listener: (event: ProviderResponse) => void,
  ) {
    document.addEventListener(eventType, listener);
  }
}

// attach the custom wallet provider to window.ethereum
window.ethereum = new CustomWalletProvider();
