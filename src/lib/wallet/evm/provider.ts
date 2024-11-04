import {Web3} from "web3";

import config from "@unstoppabledomains/config";
import {getProviderUrl} from "@unstoppabledomains/ui-components/lib/wallet/evm/provider";

export const getWeb3Provider = (chainId: number) => {
  const chainSymbol = Object.keys(config.BLOCKCHAINS).find(k => {
    return config.BLOCKCHAINS[k].CHAIN_ID === chainId;
  });
  if (!chainSymbol) {
    throw new Error(`Configuration not found for chainId: ${chainId}`);
  }

  const providerUrl = getProviderUrl(chainSymbol);
  return new Web3(providerUrl);
};
