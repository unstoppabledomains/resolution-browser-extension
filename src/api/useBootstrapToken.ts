import {useMutation} from "@tanstack/react-query";
import config from "../config";
import fetchWalletApi from "./fetchWalletApi";

type BootstrapTokenResponse = {
  accessToken: string;
  deviceId: string;
};

const bootstrapToken = async (
  bootstrapCode: string,
  deviceId?: string,
): Promise<BootstrapTokenResponse> => {
  const url = `${config.WALLET_API_URL}auth/bootstrap`;

  const options: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({code: bootstrapCode, device: deviceId || null}),
  };

  const data = await fetchWalletApi<BootstrapTokenResponse>(url, options);
  return data;
};

const useBootstrapToken = () => {
  const mutation = useMutation({
    mutationFn: async (bootstrapCode: string) => {
      const bootstrapTokenData = await bootstrapToken(bootstrapCode);
      return bootstrapTokenData;
    },
  });

  return mutation;
};

export default useBootstrapToken;
