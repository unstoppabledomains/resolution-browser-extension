import {useQuery} from "@tanstack/react-query";
import config from "../config";
import {AccountAsset} from "../types";
import fetchWalletApi from "./fetchWalletApi";

export type AccountsAssetsListResponse = {
  items: AccountAsset[];
};

const getAccountsAssetsList = async ({accountId}) => {
  const url = `${config.WALLET_API_URL}accounts/${accountId}/assets?$expand=balance`;

  const options: RequestInit = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const data = await fetchWalletApi<AccountsAssetsListResponse>(url, options);
  return data;
};

type UseGetAccountsListParams = {
  accountId: string;
  enabled: boolean;
};

const useGetAccountsAssetsList = ({
  accountId,
  enabled,
}: UseGetAccountsListParams) => {
  const query = useQuery({
    queryKey: ["accountsAssetsList", accountId],
    queryFn: () => getAccountsAssetsList({accountId}),
    enabled,
  });

  return query;
};

export default useGetAccountsAssetsList;
