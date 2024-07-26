// @ts-nocheck

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
    const resp = new Promise((resolve, reject) => {
      document.dispatchEvent(new CustomEvent("selectAccountRequest"));
      document.addEventListener(
        "selectAccountResponse",
        function listener(event) {
          document.removeEventListener("selectAccountResponse", listener);
          if (event.detail.error) {
            reject(event.detail.error);
          } else {
            resolve(event.detail.response.address);
          }
        },
      );
    });

    const account = await resp;
    return [account];
  }

  async handleChainIdRequest() {
    const resp = new Promise((resolve, reject) => {
      document.dispatchEvent(new CustomEvent("selectAccountRequest"));

      document.addEventListener(
        "selectAccountResponse",
        function listener(event) {
          document.removeEventListener("selectAccountResponse", listener);
          if (event.detail.error) {
            reject(event.detail.error);
          } else {
            resolve(event.detail.response.chainId);
          }
        },
      );
    });

    const chainId = await resp;
    return chainId;
  }

  async handlePersonalSign(params) {
    console.log("handlePersonalSign", {params});
    // TODO: Implement personal_sign
    return "";
  }
}

window.customWalletProvider = new CustomWalletProvider();
window.ethereum = window.customWalletProvider;
