// @ts-nocheck
console.log("Custom Wallet Provider script loaded");

class CustomWalletProvider {
  constructor() {
    this.isMetaMask = true; // Mimic MetaMask
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
        case "eth_sendTransaction":
          result = await this.handleSendTransaction(params);
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
    const account = "0x864122A09D1b93e6b9dA23E4415D46d40CB9b170";
    console.log("handleAccountRequest", {account});
    return [account];
  }

  async handleChainIdRequest() {
    const chainId = "11155111";
    console.log("handleChainIdRequest", {chainId});
    return chainId;
  }

  async handleSendTransaction(params) {
    console.log("handleSendTransaction", {params});
  }

  async handlePersonalSign(params) {
    console.log("handlePersonalSign", {params});

    return new Promise((resolve, reject) => {
      const eventData = {message: params[0], address: params[1]};
      document.dispatchEvent(
        new CustomEvent("handlePersonalSign", {detail: eventData}),
      );

      document.addEventListener(
        "handlePersonalSignResponse",
        function listener(event) {
          document.removeEventListener("handlePersonalSignResponse", listener);
          if (event.detail.error) {
            reject(event.detail.error);
          } else {
            resolve(event.detail.signature);
          }
        },
      );
    });
  }
}

window.customWalletProvider = new CustomWalletProvider();
window.ethereum = window.customWalletProvider;
