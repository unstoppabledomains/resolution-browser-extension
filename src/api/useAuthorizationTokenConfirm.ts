import {useMutation} from "@tanstack/react-query";
import config from "../config";
import fetchWalletApi from "./fetchWalletApi";
import {StorageSyncKey, chromeStorageSyncSet} from "../util/chromeStorageSync";

type AuthorizationTokenConfirmResponse = {
  accessToken: string;
  refreshToken: string;
  bootstrapToken: string;
};

const authorizationTokenConfirm = async (
  bootstrapJwt: string,
): Promise<AuthorizationTokenConfirmResponse> => {
  const url = `${config.WALLET_API_URL}auth/tokens/confirm`;

  const options: RequestInit = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${bootstrapJwt}`,
    },
  };

  const data = await fetchWalletApi<AuthorizationTokenConfirmResponse>(
    url,
    options,
  );

  return data;
};

export const useConfirmAuthorizationToken = () => {
  const mutation = useMutation({
    mutationFn: (bootstrapJwt: string) =>
      authorizationTokenConfirm(bootstrapJwt),
    onSuccess: (data) => {
      if (data.accessToken) {
        chromeStorageSyncSet(StorageSyncKey.AccessToken, data.accessToken);
      }
      if (data.refreshToken) {
        chromeStorageSyncSet(StorageSyncKey.RefreshToken, data.refreshToken);
      }
      if (data.bootstrapToken) {
        chromeStorageSyncSet(
          StorageSyncKey.BootstrapToken,
          data.bootstrapToken,
        );
      }
    },
  });

  return mutation;
};

export default useConfirmAuthorizationToken;
