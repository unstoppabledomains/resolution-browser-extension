import {useQuery} from "@tanstack/react-query";
import config from "../config";
import {Account} from "../types";
import fetchWalletApi from "./fetchWalletApi";

export type AccountsListResponse = {
  items: Account[];
};

const getAccountsList = async () => {
  const url = `${config.WALLET_API_URL}accounts`;

  const options: RequestInit = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const data = await fetchWalletApi<AccountsListResponse>(url, options);
  return data;
};

type UseGetAccountsListParams = {
  enabled: boolean;
};

const useGetAccountsList = ({enabled}: UseGetAccountsListParams) => {
  const query = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccountsList,
    enabled,
  });

  return query;
};

export default useGetAccountsList;
