import {useQueries} from "@tanstack/react-query";
import config from "../config";
import fetchProfileApi from "./fetchProfileApi";

export type WalletDetailsResponse = {
  address: string;
  name: string;
  symbol: string;
  totalValueUsdAmt: number;
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
  const queries = useQueries({
    queries: wallets.map((walletAddress) => ({
      queryKey: ["walletDetails", walletAddress],
      queryFn: () => getWalletDetails(walletAddress),
      staleTime: Infinity,
      enabled,
    })),
  });

  const allFetched = queries.every((query) => query.isSuccess);

  let results = allFetched ? queries.map((query) => query.data).flat() : [];

  return {
    isLoading: queries.some((query) => query.isLoading),
    isError: queries.some((query) => query.isError),
    isFetched: allFetched,
    data: results,
  };
};

export default useGetWalletDetails;
