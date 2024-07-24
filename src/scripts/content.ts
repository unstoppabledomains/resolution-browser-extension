// @ts-nocheck
console.log('Custom Wallet Provider script loaded');

class CustomWalletProvider {
  constructor() {
    this.isMetaMask = true; // Mimic MetaMask
  }

  async request({ method, params }) {
    console.log('Request received', { method, params });

    let result;
    try {
      switch (method) {
        case 'eth_requestAccounts':
          result = await this.handleAccountRequest();
          break;
        case 'eth_chainId':
          result = await this.handleChainIdRequest();
          break;
        case 'eth_sendTransaction':
          result = await this.handleSendTransaction(params);
          break;
        case 'personal_sign':
          result = await this.handlePersonalSign(params);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      console.log('Request successful', { method, result });
      return result;
    } catch (error) {
      console.log('Request failed', { method, error });
      throw error;
    }
  }

  async handleAccountRequest() {
    const account = '0xCCCCCCCCCCC';
    console.log('handleAccountRequest', { account });
    return [account];
  }

  async handleChainIdRequest() {
    const chainId = '0x1';
    console.log('handleChainIdRequest', { chainId });
    return chainId;
  }

  async handleSendTransaction(params) {
    console.log('handleSendTransaction', { params });
  }

  async handlePersonalSign(params) {
    console.log('handlePersonalSign', { params });
  }
}

window.customWalletProvider = new CustomWalletProvider();
window.ethereum = window.customWalletProvider;
