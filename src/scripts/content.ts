// @ts-nocheck

let cachedAccountAddress = null;
let cachedAccountChainId = null;

class CustomWalletProvider {
  isMetaMask: boolean;

  constructor() {
    this.isMetaMask = true;
  }

  async request({method, params}) {
    console.log("Request received", {method, params});

    let result;
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

    const resp = new Promise((resolve, reject) => {
      document.dispatchEvent(new CustomEvent("selectAccountRequest"));
      document.addEventListener(
        "selectAccountResponse",
        function listener(event) {
          document.removeEventListener("selectAccountResponse", listener);
          if (event.detail.error) {
            reject(event.detail.error);
          } else {
            cachedAccountAddress = event.detail.address;
            cachedAccountChainId = event.detail.chainId;
            resolve(event.detail.address);
          }
        },
      );
    });

    const account = await resp;
    return [account];
  }

  async handleChainIdRequest() {
    if (cachedAccountChainId) {
      return cachedAccountChainId;
    }

    const resp = new Promise((resolve, reject) => {
      document.dispatchEvent(new CustomEvent("selectChainIdRequest"));

      document.addEventListener(
        "selectChainIdResponse",
        function listener(event) {
          document.removeEventListener("selectChainIdResponse", listener);
          if (event.detail.error) {
            reject(event.detail.error);
          } else {
            resolve(event.detail.chainId);
          }
        },
      );
    });

    const chainId = await resp;
    return chainId;
  }

  async handlePersonalSign(params: any) {
    const resp = new Promise((resolve, reject) => {
      document.dispatchEvent(
        new CustomEvent("signMessageRequest", {
          detail: params,
        }),
      );

      document.addEventListener(
        "signMessageResponse",
        function listener(event) {
          document.removeEventListener("signMessageResponse", listener);
          if (event.detail.error) {
            reject(event.detail.error);
          } else {
            resolve(event.detail.response);
          }
        },
      );
    });

    const signResponse = await resp;
    return signResponse;
  }

  async handleRequestPermissions(params: any) {
    const resp = new Promise((resolve, reject) => {
      document.dispatchEvent(
        new CustomEvent("requestPermissionsRequest", {
          detail: params,
        }),
      );
      document.addEventListener(
        "requestPermissionsResponse",
        function listener(event) {
          document.removeEventListener("requestPermissionsResponse", listener);
          if (event.detail.error) {
            reject(event.detail.error);
          } else {
            cachedAccountAddress = event.detail.address;
            cachedAccountChainId = event.detail.chainId;
            resolve(event.detail.permissions);
          }
        },
      );
    });

    const permissions = await resp;
    return permissions;
  }
}

window.customWalletProvider = new CustomWalletProvider();
window.ethereum = window.customWalletProvider;
