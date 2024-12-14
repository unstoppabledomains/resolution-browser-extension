import {Transaction, VersionedTransaction} from "@solana/web3.js";
import bs58 from "bs58";

import config from "@unstoppabledomains/config";
import {fetchApi} from "@unstoppabledomains/ui-components";

import {SimulationResults} from "../../../types/solana/simulation";
import {Logger} from "../../logger";

export const simulateTransaction = async (
  accessToken: string,
  ownerAddress: string,
  tx: Transaction | VersionedTransaction,
): Promise<SimulationResults> => {
  const results = await fetchApi<SimulationResults>(
    `/user/${ownerAddress}/wallet/simulate`,
    {
      method: "POST",
      mode: "cors",
      headers: {
        "Access-Control-Allow-Credentials": "true",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      host: config.PROFILE.HOST_URL,
      body: JSON.stringify({serializedTx: bs58.encode(tx.serialize())}),
    },
  );

  Logger.log("simulation results", JSON.stringify(results, undefined, 2));
  return results;
};
