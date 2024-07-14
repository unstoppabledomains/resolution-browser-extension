import {env} from "./env";

export default {
  WALLET_API_URL: `https://api.ud-staging.com/wallet/v1/`,
  PROFILE_API_URL: `https://api.ud-staging.com/profile/`,
  UNSTOPPABLE_WEBSITE_URL: "https://www.ud-staging.com",
  WALLETS: {
    CHAINS: {
      BUY: ["BTC/BTC", "MATIC/MATIC", "SOL/SOL", "ETH/ETH"],
      SEND: [
        "BTC/BTC",
        "MATIC/MATIC",
        "MATIC/USDC",
        "SOL/SOL",
        "BASE/ETH",
        "ETH/ETH",
      ],
      RECEIVE: [
        "BTC/BTC",
        "MATIC/MATIC",
        "MATIC/USDC",
        "SOL/SOL",
        "BASE/ETH",
        "ETH/ETH",
      ],
    },
  },
  BLOCKCHAINS: {
    ETH: {
      BLOCK_EXPLORER_TX_URL: "https://www.oklink.com/sepolia-test/tx/",
    },
    MATIC: {
      BLOCK_EXPLORER_TX_URL: "https://www.oklink.com/amoy/tx/",
    },
    BASE: {
      BLOCK_EXPLORER_TX_URL: "https://www.oklink.com/base/tx/",
    },
    BTC: {
      BLOCK_EXPLORER_TX_URL: "https://www.oklink.com/btc/tx/",
    },
    SOL: {
      BLOCK_EXPLORER_TX_URL: "https://www.oklink.com/sol/tx/",
    },
  },
  ...env,
};
