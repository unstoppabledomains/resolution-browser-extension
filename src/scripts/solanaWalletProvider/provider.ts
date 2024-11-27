import {
  SolanaSignInInput,
  SolanaSignInOutput,
} from "@solana/wallet-standard-features";
import {
  PublicKey,
  SendOptions,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import {fetcher} from "@xmtp/proto";
import {EventEmitter} from "events";

import {Logger} from "../../lib/logger";
import {SolanaWalletAccount} from "../../types/solana/account";
import {SolanaConnectResult, SolanaProvider} from "../../types/solana/provider";
import {RequestArgs} from "../../types/wallet/provider";

type requestFn = (r: RequestArgs) => Promise<any>;

/**
 * Handles interaction between the browser window and the browser extension background
 * processing for Solana operations.
 */
export class SolanaWalletProvider
  extends EventEmitter
  implements SolanaProvider
{
  publicKey: PublicKey | null = null;
  private request: requestFn;

  constructor(requestProxy: requestFn) {
    super();
    this.request = requestProxy;
  }

  async connect(): Promise<SolanaConnectResult> {
    // prompt the user for permission to connect, if they have not yet authorized
    // a connection to this app. If a connection to this app is already allowed,
    // the account data will be provided without prompting the user.
    const connectResult = await this.request({
      method: "wallet_requestPermissions",
      params: [{solana_accounts: {}}],
    });

    // create public key from the provided wallet address
    if (
      connectResult &&
      connectResult.length > 0 &&
      connectResult[0].account?.address
    ) {
      this.emit("connect", connectResult[0].account.address);
      return {
        publicKey: new PublicKey(connectResult[0].account.address),
      };
    }

    // retrieve the account information and return the public key
    throw new Error("unable to connect");
  }

  async disconnect(): Promise<void> {
    this.emit("disconnect");
  }

  async signMessage(message: Uint8Array): Promise<{signature: Uint8Array}> {
    // request to sign the message
    const signatureResult = await this.request({
      method: "solana_signMessage",
      params: [fetcher.b64Encode(message, 0, message.length)],
    });

    // return the result
    if (signatureResult) {
      return {
        signature: fetcher.b64Decode(signatureResult),
      };
    }

    Logger.log(
      "Unstoppable .signMessage() method not implemented",
      JSON.stringify(message),
    );
    throw new Error("message not signed");
  }

  async signIn(input?: SolanaSignInInput): Promise<SolanaSignInOutput> {
    // request a connection to the app
    const accountPublicKey = await this.connect();

    // normalize input payload
    const inputNormalized: SolanaSignInInput = {
      ...input,
      address: accountPublicKey.publicKey.toBase58(),
      domain: input?.domain ? input.domain : window.location.hostname,
    };
    const inputToSign = new TextEncoder().encode(
      JSON.stringify(inputNormalized, undefined, 2),
    );

    // sign the normalized payload
    const signatureResponse = await this.signMessage(inputToSign);

    // generate the response payload
    return {
      account: new SolanaWalletAccount({
        address: accountPublicKey.publicKey.toBase58(),
        publicKey: accountPublicKey.publicKey.toBytes(),
      }),
      signedMessage: inputToSign,
      signature: signatureResponse.signature,
    };
  }

  async signAndSendTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
    opts?: SendOptions,
  ): Promise<{signature: string}> {
    Logger.log(
      "Unstoppable .signAndSendTransaction() method not implemented",
      JSON.stringify({transaction, opts}),
    );
    throw new Error("Method not yet implemented");
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
  ): Promise<T> {
    Logger.log(
      "Unstoppable .signTransaction() method not implemented",
      JSON.stringify(transaction),
    );
    throw new Error("Method not yet implemented");
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[],
  ): Promise<T[]> {
    Logger.log(
      "Unstoppable .signAllTransactions() method not implemented",
      JSON.stringify(transactions),
    );
    throw new Error("Method not yet implemented");
  }
}
