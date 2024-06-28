import {useMutation} from "@tanstack/react-query";
import config from "../config";
import fetchWalletApi from "./fetchWalletApi";
import {sleep} from "../util/sleep";

type AuthorizationTokenSetupResponse = {
  status: string;
  transactionId: string;
};

const authorizationTokenSetup = async (bootstrapJwt: string) => {
  const url = `${config.WALLET_API_URL}auth/tokens/setup`;

  const options: RequestInit = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${bootstrapJwt}`,
    },
  };

  const data = await fetchWalletApi<AuthorizationTokenSetupResponse>(
    url,
    options,
  );

  return data;
};

const authorizationTokenSetupStatus = async (bootstrapJwt: string) => {
  const url = `${config.WALLET_API_URL}auth/tokens/setup`;

  const options: RequestInit = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${bootstrapJwt}`,
    },
  };

  const data = await fetchWalletApi<AuthorizationTokenSetupResponse>(
    url,
    options,
  );

  return data;
};

const useAuthorizationTokenSetup = () => {
  const mutation = useMutation({
    mutationFn: async (bootstrapJwt: string) => {
      const transactionData = await authorizationTokenSetup(bootstrapJwt);

      if (transactionData) {
        let tx = await authorizationTokenSetupStatus(bootstrapJwt);
        for (let i = 0; i < 10; i++) {
          if (tx.status === "PENDING_SIGNATURE") {
            break;
          }
          if (!tx) {
            return;
          }
          await sleep(1000);
          tx = await authorizationTokenSetupStatus(bootstrapJwt);
        }
        return tx;
      }
    },
  });

  return mutation;
};

export default useAuthorizationTokenSetup;
