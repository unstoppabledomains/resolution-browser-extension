import {Metaplex} from "@metaplex-foundation/js";
import {ACCOUNT_SIZE, AccountLayout} from "@solana/spl-token";
import {ENV, TokenListProvider} from "@solana/spl-token-registry";
import {
  AccountInfo,
  LAMPORTS_PER_SOL,
  ParsedAccountData,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import bluebird from "bluebird";

import {getSolanaProvider} from "@unstoppabledomains/ui-components/lib/wallet/solana/provider";
import {isVersionedTransaction} from "@unstoppabledomains/ui-components/lib/wallet/solana/transaction";

import {
  SimulationEntry,
  SimulationResults,
  TokenMetadataEntry,
} from "../../../types/solana/simulation";
import {Logger} from "../../logger";

export const getRelevantAccounts = async (
  ownerAddress: string,
  addresses: string[],
) => {
  const rpcConnection = getSolanaProvider();
  return await bluebird
    .map(
      addresses,
      async address => {
        const info = await rpcConnection.getParsedAccountInfo(
          new PublicKey(address),
        );
        return {
          address,
          accountInfo: info.value as AccountInfo<ParsedAccountData>,
        };
      },
      {concurrency: 3},
    )
    .filter(account => {
      // keep owner account
      if (account.address.toLowerCase() === ownerAddress.toLowerCase()) {
        return true;
      }

      // keep any child of owner account
      const result = account.accountInfo?.data?.parsed?.info;
      return result?.owner?.toLowerCase() === ownerAddress.toLowerCase();
    });
};

export const getTokenMetadata = async (
  tokenMint: string,
): Promise<TokenMetadataEntry> => {
  const connection = getSolanaProvider();
  const metaplex = Metaplex.make(connection as any);

  const mintAddress = new PublicKey(tokenMint);

  const metadataAccount = metaplex.nfts().pdas().metadata({mint: mintAddress});

  const metadataAccountInfo = await connection.getAccountInfo(metadataAccount);

  if (metadataAccountInfo) {
    const token = await metaplex.nfts().findByMint({mintAddress});
    return {
      tokenName: token.name,
      tokenSymbol: token.symbol,
      tokenLogo: token.json?.image,
    };
  } else {
    const provider = await new TokenListProvider().resolve();
    const tokenList = provider.filterByChainId(ENV.MainnetBeta).getList();
    const tokenMap = tokenList.reduce((map, item) => {
      map.set(item.address, item);
      return map;
    }, new Map());

    const token = tokenMap.get(mintAddress.toBase58());

    return {
      tokenName: token.name,
      tokenSymbol: token.symbol,
      tokenLogo: token.logoURI,
    };
  }
};

export const simulateTransaction = async (
  ownerAddress: string,
  tx: Transaction | VersionedTransaction,
): Promise<SimulationResults> => {
  // retrieve simulation addresses
  const startTime = Date.now();
  const initialAccountState = await getRelevantAccounts(
    ownerAddress,
    isVersionedTransaction(tx)
      ? tx.message.staticAccountKeys.map(a => a.toBase58())
      : [ownerAddress],
  );

  // send to RPC simulation endpoint
  const rpcProvider = getSolanaProvider();
  const txSimulated = isVersionedTransaction(tx)
    ? await rpcProvider.simulateTransaction(tx, {
        accounts: {
          encoding: "base64",
          addresses: initialAccountState.map(a => a.address),
        },
        commitment: "finalized",
        replaceRecentBlockhash: true,
        sigVerify: false,
      })
    : await rpcProvider.simulateTransaction(tx);

  // ensure the before and after accounts match
  if (initialAccountState.length !== txSimulated.value.accounts?.length) {
    Logger.log("simulation pre and post state mismatch");
    return {
      success: false,
      results: [],
      logs: txSimulated.value.logs || [],
      errorMessage: "cannot determine post transaction state",
    };
  }

  // compare SOL balances pre and post transaction
  const preTxAmount = initialAccountState
    .map(a => a.accountInfo.lamports)
    .reduce((a, b) => a + b, 0);
  const postTxAmount = txSimulated.value.accounts
    ?.map(a => a?.lamports || 0)
    .reduce((a, b) => a + b, 0);
  const txSpend = (postTxAmount - preTxAmount) / LAMPORTS_PER_SOL;
  const tokenAccountMap: Record<string, SimulationEntry> = {
    SOL: {
      pre: preTxAmount,
      post: postTxAmount,
      delta: txSpend,
      metadata: {
        tokenName: "Solana",
        tokenSymbol: "SOL",
        tokenLogo:
          "https://storage.googleapis.com/unstoppable-client-assets/images/icons/SOL/icon.svg",
      },
    },
  };

  // compare token account balances pre and post transaction
  initialAccountState.map(a => {
    if (
      !a.accountInfo.data?.parsed?.info?.tokenAmount?.decimals ||
      !a.accountInfo.data?.parsed?.info?.mint
    ) {
      return;
    }
    tokenAccountMap[a.accountInfo.data.parsed.info.mint] = {
      decimals: a.accountInfo.data?.parsed?.info?.tokenAmount?.decimals,
      pre: a.accountInfo.data?.parsed?.info?.tokenAmount?.uiAmount || 0,
      post: 0,
      delta: 0,
    };
  });
  txSimulated.value.accounts
    ?.filter(a => {
      if (!a || a.data.length === 0) {
        return false;
      }
      const data = Buffer.from(a.data[0], "base64");
      return data.length === ACCOUNT_SIZE;
    })
    .map(a => {
      const data = Buffer.from(a!.data[0], "base64");
      const info = AccountLayout.decode(data);
      if (!tokenAccountMap[info.mint.toBase58()]?.decimals) {
        return;
      }
      tokenAccountMap[info.mint.toBase58()].post =
        Number(info.amount) /
        Math.pow(10, tokenAccountMap[info.mint.toBase58()].decimals!);
      tokenAccountMap[info.mint.toBase58()].delta =
        tokenAccountMap[info.mint.toBase58()].post -
        tokenAccountMap[info.mint.toBase58()].pre;
    });

  // inject token metadata
  await bluebird.map(Object.keys(tokenAccountMap), async key => {
    const tokenEntry = tokenAccountMap[key];
    if (tokenEntry.metadata) {
      return;
    }
    if (tokenEntry.delta === 0) {
      return;
    }
    tokenEntry.metadata = await getTokenMetadata(key);
    if (tokenEntry.metadata?.tokenSymbol && !tokenEntry.metadata.tokenLogo) {
      tokenEntry.metadata.tokenLogo = `https://storage.googleapis.com/unstoppable-client-assets/images/icons/${tokenEntry.metadata.tokenSymbol}/icon.svg`;
    }
  });

  // normalize and return the simulation results
  const results = {
    success: txSimulated.value.err === null,
    logs: txSimulated.value.logs || [],
    results: Object.keys(tokenAccountMap)
      .map(k => tokenAccountMap[k])
      .filter(r => r.delta !== 0)
      .sort((a, b) => b.delta - a.delta),
    errorMessage: txSimulated.value.err || undefined,
  };
  Logger.log(
    "simulation results",
    JSON.stringify({elapsed: Date.now() - startTime, results}, undefined, 2),
  );
  return results;
};
