import {useMutation} from "@tanstack/react-query";
import config from "../config";
import fetchWalletApi from "./fetchWalletApi";
import {pollUntilSuccess} from "../util/poll";

type AuthorizationTokenSetupResponse = {
  status: string;
  transactionId: string;
};

const authorizationTokenSetup = async (
  bootstrapJwt: string,
): Promise<AuthorizationTokenSetupResponse> => {
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

const authorizationTokenSetupStatus = async (
  bootstrapJwt: string,
): Promise<AuthorizationTokenSetupResponse> => {
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
        const {success, value: tx} = await pollUntilSuccess({
          fn: async () => {
            const tx = await authorizationTokenSetupStatus(bootstrapJwt);
            if (tx.status === "PENDING_SIGNATURE") {
              return {success: true, value: tx};
            }
            return {success: false, value: null};
          },
          attempts: 10,
          interval: 1000,
        });
        if (!success) {
          throw new Error("Failed authorization token setup");
        }
        return tx;
      }
    },
  });

  return mutation;
};

export default useAuthorizationTokenSetup;
