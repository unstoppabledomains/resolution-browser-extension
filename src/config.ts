import {env} from "./env";

export default {
  WALLET_API_URL: `https://api.ud-staging.com/wallet/v1/`,
  PROFILE_API_URL: `https://api.ud-staging.com/profile/`,
  ...env,
};
