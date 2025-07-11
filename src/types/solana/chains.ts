// This is copied from @solana/wallet-standard-chains
import {Transaction, VersionedTransaction} from "@solana/web3.js";
import type {IdentifierString} from "@wallet-standard/base";
import bs58 from "bs58";

/** Solana Mainnet (beta) cluster, e.g. https://api.mainnet-beta.solana.com */
export const SOLANA_MAINNET_CHAIN = "solana:mainnet";

/** Solana Devnet cluster, e.g. https://api.devnet.solana.com */
export const SOLANA_DEVNET_CHAIN = "solana:devnet";

/** Solana Testnet cluster, e.g. https://api.testnet.solana.com */
export const SOLANA_TESTNET_CHAIN = "solana:testnet";

/** Solana Localnet cluster, e.g. http://localhost:8899 */
export const SOLANA_LOCALNET_CHAIN = "solana:localnet";

/** Array of all Solana clusters */
export const SOLANA_CHAINS = [
  SOLANA_MAINNET_CHAIN,
  SOLANA_DEVNET_CHAIN,
  SOLANA_TESTNET_CHAIN,
  SOLANA_LOCALNET_CHAIN,
] as const;

/** Type of all Solana clusters */
export type SolanaChain = (typeof SOLANA_CHAINS)[number];

/**
 * Check if a chain corresponds with one of the Solana clusters.
 */
export function isSolanaChain(chain: IdentifierString): chain is SolanaChain {
  return (
    SOLANA_CHAINS.includes(chain as SolanaChain) ||
    chain.toLowerCase().startsWith("solana")
  );
}

export const deserializeTxB58 = (
  b58SerializedTx: string,
): Transaction | VersionedTransaction => {
  try {
    return VersionedTransaction.deserialize(bs58.decode(b58SerializedTx));
  } catch (e) {
    return Transaction.from(bs58.decode(b58SerializedTx));
  }
};

export const deserializeTxHex = (
  hexSerializedTx: string,
): Transaction | VersionedTransaction => {
  try {
    return VersionedTransaction.deserialize(
      Buffer.from(hexSerializedTx, "hex"),
    );
  } catch (e) {
    return Transaction.from(Buffer.from(hexSerializedTx, "hex"));
  }
};
