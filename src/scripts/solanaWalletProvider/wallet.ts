import {
  SolanaSignAndSendTransaction,
  SolanaSignAndSendTransactionFeature,
  SolanaSignAndSendTransactionMethod,
  SolanaSignAndSendTransactionOutput,
  SolanaSignIn,
  SolanaSignInFeature,
  SolanaSignInMethod,
  SolanaSignInOutput,
  SolanaSignMessage,
  SolanaSignMessageFeature,
  SolanaSignMessageMethod,
  SolanaSignMessageOutput,
  SolanaSignTransaction,
  SolanaSignTransactionFeature,
  SolanaSignTransactionMethod,
  SolanaSignTransactionOutput,
} from "@solana/wallet-standard-features";
import {Transaction, VersionedTransaction} from "@solana/web3.js";
import type {Wallet} from "@wallet-standard/base";
import {
  StandardConnect,
  StandardConnectFeature,
  StandardConnectMethod,
  StandardDisconnect,
  StandardDisconnectFeature,
  StandardDisconnectMethod,
  StandardEvents,
  StandardEventsFeature,
  StandardEventsListeners,
  StandardEventsNames,
  StandardEventsOnMethod,
} from "@wallet-standard/features";
import bs58 from "bs58";

import {isVersionedTransaction} from "@unstoppabledomains/ui-components/lib/wallet/solana/transaction";

import config, {LOGO_BASE_64} from "../../config";
import {SolanaWalletAccount} from "../../types/solana/account";
import {SolanaChain, isSolanaChain} from "../../types/solana/chains";
import {
  SolanaFeature,
  SolanaNamespace,
  SolanaProvider,
} from "../../types/solana/provider";
import {bytesEqual} from "./util";

/**
 * A wrapper that implements the Solana wallet standard to interact with the
 * browser, and pass messages to the extension runtime.
 */
export class SolanaWallet implements Wallet {
  readonly #listeners: {
    [E in StandardEventsNames]?: StandardEventsListeners[E][];
  } = {};
  readonly #version = "1.0.0" as const;
  readonly #name = `${config.extension.name}` as const;
  readonly #icon = `data:image/png;base64,${LOGO_BASE_64}` as const;
  readonly #provider: SolanaProvider;
  #account: SolanaWalletAccount | null = null;

  get version() {
    return this.#version;
  }

  get name() {
    return this.#name;
  }

  get icon() {
    return this.#icon;
  }

  get chains() {
    return [];
  }

  get accounts() {
    return this.#account ? [this.#account] : [];
  }

  get features(): StandardConnectFeature &
    StandardDisconnectFeature &
    StandardEventsFeature &
    SolanaSignAndSendTransactionFeature &
    SolanaSignTransactionFeature &
    SolanaSignMessageFeature &
    SolanaSignInFeature &
    SolanaFeature {
    return {
      [StandardConnect]: {
        version: this.#version,
        connect: this.#connect,
      },
      [StandardDisconnect]: {
        version: this.#version,
        disconnect: this.#disconnect,
      },
      [StandardEvents]: {
        version: this.#version,
        on: this.#on,
      },
      [SolanaSignAndSendTransaction]: {
        version: this.#version,
        supportedTransactionVersions: ["legacy", 0],
        signAndSendTransaction: this.#signAndSendTransaction,
      },
      [SolanaSignTransaction]: {
        version: this.#version,
        supportedTransactionVersions: ["legacy", 0],
        signTransaction: this.#signTransaction,
      },
      [SolanaSignMessage]: {
        version: this.#version,
        signMessage: this.#signMessage,
      },
      [SolanaSignIn]: {
        version: this.#version,
        signIn: this.#signIn,
      },
      [SolanaNamespace]: {
        unstoppableSolana: this.#provider,
      },
    };
  }

  constructor(provider: SolanaProvider) {
    if (new.target === SolanaWallet) {
      Object.freeze(this);
    }

    this.#provider = provider;

    provider.on("connect", this.#connected, this);
    provider.on("disconnect", this.#disconnected, this);
    provider.on("accountChanged", this.#reconnected, this);

    this.#connected();
  }

  #on: StandardEventsOnMethod = (event, listener) => {
    if (!this.#listeners[event]?.push(listener)) {
      this.#listeners[event] = [listener];
    }
    return (): void => this.#off(event, listener);
  };

  #emit<E extends StandardEventsNames>(
    event: E,
    ...args: Parameters<StandardEventsListeners[E]>
  ): void {
    // eslint-disable-next-line prefer-spread
    this.#listeners[event]?.forEach(listener => listener.apply(null, args));
  }

  #off<E extends StandardEventsNames>(
    event: E,
    listener: StandardEventsListeners[E],
  ): void {
    this.#listeners[event] = this.#listeners[event]?.filter(
      existingListener => listener !== existingListener,
    );
  }

  #connected = () => {
    const address = this.#provider.publicKey?.toBase58();
    if (address) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const publicKey = this.#provider.publicKey!.toBytes();

      const account = this.#account;
      if (
        !account ||
        account.address !== address ||
        !bytesEqual(account.publicKey, publicKey)
      ) {
        this.#account = new SolanaWalletAccount({address, publicKey});
        this.#emit("change", {accounts: this.accounts});
      }
    }
  };

  #disconnected = () => {
    if (this.#account) {
      this.#account = null;
      this.#emit("change", {accounts: this.accounts});
    }
  };

  #reconnected = () => {
    if (this.#provider.publicKey) {
      this.#connected();
    } else {
      this.#disconnected();
    }
  };

  #connect: StandardConnectMethod = async ({silent} = {}) => {
    if (!this.#account) {
      const connectResult = await this.#provider.connect(
        silent ? {onlyIfTrusted: true} : undefined,
      );
      this.#account = new SolanaWalletAccount({
        address: connectResult.publicKey.toBase58(),
        publicKey: connectResult.publicKey.toBytes(),
      });
    }

    this.#connected();
    return {accounts: this.accounts};
  };

  #disconnect: StandardDisconnectMethod = async () => {
    await this.#provider.disconnect();
  };

  #signAndSendTransaction: SolanaSignAndSendTransactionMethod = async (
    ...inputs
  ) => {
    if (!this.#account) throw new Error("not connected");

    const outputs: SolanaSignAndSendTransactionOutput[] = [];

    if (inputs.length === 1) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const {transaction, account, chain, options} = inputs[0]!;
      const {minContextSlot, preflightCommitment, skipPreflight, maxRetries} =
        options || {};
      if (account !== this.#account) throw new Error("invalid account");
      if (!isSolanaChain(chain)) throw new Error("invalid chain");

      const {signature} = await this.#provider.signAndSendTransaction(
        VersionedTransaction.deserialize(transaction),
        {
          preflightCommitment,
          minContextSlot,
          maxRetries,
          skipPreflight,
        },
      );

      outputs.push({signature: bs58.decode(signature)});
    } else if (inputs.length > 1) {
      for (const input of inputs) {
        outputs.push(...(await this.#signAndSendTransaction(input)));
      }
    }

    return outputs;
  };

  #signTransaction: SolanaSignTransactionMethod = async (...inputs) => {
    if (!this.#account) throw new Error("not connected");

    const outputs: SolanaSignTransactionOutput[] = [];

    if (inputs.length === 1) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const {transaction, account, chain} = inputs[0]!;
      if (account !== this.#account) throw new Error("invalid account");
      if (chain && !isSolanaChain(chain)) throw new Error("invalid chain");

      const signedTransaction = await this.#provider.signTransaction(
        VersionedTransaction.deserialize(transaction),
      );

      const serializedTransaction = isVersionedTransaction(signedTransaction)
        ? signedTransaction.serialize()
        : new Uint8Array(
            (signedTransaction as Transaction).serialize({
              requireAllSignatures: false,
              verifySignatures: false,
            }),
          );

      outputs.push({signedTransaction: serializedTransaction});
    } else if (inputs.length > 1) {
      let chain: SolanaChain | undefined;
      for (const input of inputs) {
        if (input.account !== this.#account) throw new Error("invalid account");
        if (input.chain) {
          if (!isSolanaChain(input.chain)) throw new Error("invalid chain");
          if (chain) {
            if (input.chain !== chain) throw new Error("conflicting chain");
          } else {
            chain = input.chain;
          }
        }
      }

      const transactions = inputs.map(({transaction}) =>
        VersionedTransaction.deserialize(transaction),
      );

      const signedTransactions =
        await this.#provider.signAllTransactions(transactions);

      outputs.push(
        ...signedTransactions.map(signedTransaction => {
          const serializedTransaction = isVersionedTransaction(
            signedTransaction,
          )
            ? signedTransaction.serialize()
            : new Uint8Array(
                (signedTransaction as Transaction).serialize({
                  requireAllSignatures: false,
                  verifySignatures: false,
                }),
              );

          return {signedTransaction: serializedTransaction};
        }),
      );
    }

    return outputs;
  };

  #signMessage: SolanaSignMessageMethod = async (...inputs) => {
    if (!this.#account) throw new Error("not connected");

    const outputs: SolanaSignMessageOutput[] = [];

    if (inputs.length === 1) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const {message, account} = inputs[0]!;
      if (account !== this.#account) throw new Error("invalid account");

      const {signature} = await this.#provider.signMessage(message);

      outputs.push({signedMessage: message, signature});
    } else if (inputs.length > 1) {
      for (const input of inputs) {
        outputs.push(...(await this.#signMessage(input)));
      }
    }

    return outputs;
  };

  #signIn: SolanaSignInMethod = async (...inputs) => {
    const outputs: SolanaSignInOutput[] = [];

    if (inputs.length > 1) {
      for (const input of inputs) {
        outputs.push(await this.#provider.signIn(input));
      }
    } else {
      return [await this.#provider.signIn(inputs[0])];
    }

    return outputs;
  };
}
