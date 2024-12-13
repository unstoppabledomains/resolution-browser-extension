import {TransactionError} from "@solana/web3.js";

export interface TokenMetadataEntry {
  tokenName: string;
  tokenSymbol: string;
  tokenLogo?: string;
}

export interface SimulationResults {
  success: boolean;
  logs: string[];
  results: SimulationEntry[];
  errorMessage?: TransactionError | string;
}

export interface SimulationEntry {
  decimals?: number;
  pre: number;
  post: number;
  delta: number;
  metadata?: TokenMetadataEntry;
}
