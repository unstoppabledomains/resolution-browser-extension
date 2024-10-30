import type {Signer} from "ethers";

import {signMessage} from "@unstoppabledomains/ui-components/actions/fireBlocksActions";
import {localStorageWrapper} from "@unstoppabledomains/ui-components/components/Chat/storage";
import {ReactSigner} from "@unstoppabledomains/ui-components/lib/fireBlocks/reactSigner";
import {FireblocksStateKey} from "@unstoppabledomains/ui-components/lib/types/fireBlocks";

export const getSigner = async (
  address: string,
  accessToken: string,
): Promise<Signer> => {
  // retrieve bootstrap state
  const stateValue = await localStorageWrapper.getItem(FireblocksStateKey);
  if (!stateValue) {
    throw new Error("invalid fireblocks state");
  }

  // initialize the required state objects
  const state = JSON.parse(stateValue);
  const saveState = async (v: any) => {
    await localStorageWrapper.setItem(FireblocksStateKey, JSON.stringify(v));
  };

  // initialize the signer
  const signer = new ReactSigner(address, {
    signMessageWithFireblocks: async (
      message: string,
      signingAddress?: string,
      chainId?: number,
    ) => {
      return await signMessage(
        message,
        {accessToken, state, saveState},
        {address: signingAddress, chainId},
      );
    },
  });
  return signer as unknown as Signer;
};
