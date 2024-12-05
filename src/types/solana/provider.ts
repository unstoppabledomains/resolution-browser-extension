import type {
  SolanaSignInInput,
  SolanaSignInOutput,
} from "@solana/wallet-standard-features";
import type {
  PublicKey,
  SendOptions,
  Transaction,
  TransactionSignature,
  VersionedTransaction,
} from "@solana/web3.js";

export const SolanaNamespace = "unstoppableSolana:";

export type SolanaFeature = {
  [SolanaNamespace]: {
    unstoppableSolana: SolanaProvider;
  };
};

export interface SolanaEvent {
  connect(...args: unknown[]): unknown;
  disconnect(...args: unknown[]): unknown;
  accountChanged(...args: unknown[]): unknown;
}

export interface SolanaConnectOptions {
  onlyIfTrusted?: boolean;
}

export interface SolanaConnectResult {
  publicKey: PublicKey;
}

interface SolanaEventEmitter {
  on<E extends keyof SolanaEvent>(
    event: E,
    listener: SolanaEvent[E],
    context?: any,
  ): void;
  off<E extends keyof SolanaEvent>(
    event: E,
    listener: SolanaEvent[E],
    context?: any,
  ): void;
}

export interface SolanaProvider extends SolanaEventEmitter {
  publicKey: PublicKey | null;
  connect(options?: SolanaConnectOptions): Promise<{publicKey: PublicKey}>;
  disconnect(): Promise<void>;
  signAndSendTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
    options?: SendOptions,
  ): Promise<{signature: TransactionSignature}>;
  signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
  ): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[],
  ): Promise<T[]>;
  signMessage(message: Uint8Array): Promise<{signature: Uint8Array}>;
  signIn(input?: SolanaSignInInput): Promise<SolanaSignInOutput>;
}
