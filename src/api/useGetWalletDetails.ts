import {useQueries, useQuery} from "@tanstack/react-query";
import config from "../config";
import fetchProfileApi from "./fetchProfileApi";
import {TokenSymbol} from "../types";

export type WalletDetailsResponse = {
  address: string;
  name: string;
  symbol: string;
  balance: string;
  value: {
    walletUsd: string;
  };
};

const getWalletDetails = async (walletId: string) => {
  const url = `${config.PROFILE_API_URL}user/${walletId}/wallets?forceRefresh=${Date.now()}`;

  const options: RequestInit = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const data = await fetchProfileApi<WalletDetailsResponse>(url, options);
  return data;
};

type UseGetWalletDetailsParams = {
  wallets: string[];
  enabled: boolean;
};

const useGetWalletDetails = ({
  wallets,
  enabled = true,
}: UseGetWalletDetailsParams) => {
  const query = useQueries({
    queries: wallets.map((walletAddress) => ({
      queryKey: ["walletDetails", walletAddress],
      queryFn: () => getWalletDetails(walletAddress),
      staleTime: Infinity,
    })),
  });

  return query;
};

export default useGetWalletDetails;
