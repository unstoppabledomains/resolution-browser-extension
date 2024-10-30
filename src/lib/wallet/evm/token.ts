import {erc20Abi} from "abitype/abis";
import {Web3} from "web3";

import {CreateTransaction} from "@unstoppabledomains/ui-components";

const web3 = new Web3();

export const createErc20TransferTx = (
  chainId: number,
  tokenAddress: string,
  fromAddress: string,
  toAddress: string,
  amount: number,
): CreateTransaction => {
  // ERC-20 contract instance for sending a specific token
  const erc20Contract = new web3.eth.Contract(erc20Abi, tokenAddress, {
    from: fromAddress,
  });

  // create the transaction that should be signed to execute ERC-20 transfer
  return {
    chainId,
    to: tokenAddress,
    data: erc20Contract.methods.transfer(toAddress, amount).encodeABI(),
    value: "0",
  };
};
