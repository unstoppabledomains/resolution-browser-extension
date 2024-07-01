import React, {useEffect} from "react";
import {Box, Skeleton, Typography} from "@mui/material";
import useGetAccountsList, {
  AccountsListResponse,
} from "../../api/useGetAccountsList";
import useGetAccountsAssetsList from "../../api/useGetAccountsAssetsList";
import TokenItem from "./TokenItem";
import useGetWalletDetails, {
  WalletDetailsResponse,
} from "../../api/useGetWalletDetails";
import {uniqueArray} from "../../util/helpers";
import TotalBallance from "./TotalBallance";
import {UseQueryResult} from "@tanstack/react-query";

type WalletAccountProps = {
  accountsList: AccountsListResponse;
};

const WalletAccount: React.FC<WalletAccountProps> = () => {
  const [walletAddresses, setWalletAddresses] = React.useState<string[]>([]);
  const {data: accountsList} = useGetAccountsList({
    enabled: true,
  });

  const {data: accountsAssetsList, isFetched: isAccountsAssetsListFetched} =
    useGetAccountsAssetsList({
      accountId: accountsList?.items?.[0]?.id,
      enabled: !!accountsList,
    });

  useEffect(() => {
    if (accountsAssetsList) {
      let walletsToSet = accountsAssetsList.items.map(
        (account) => account.address,
      );
      setWalletAddresses(uniqueArray(walletsToSet));
    }
  }, [isAccountsAssetsListFetched]);

  const walletDetailsResult = useGetWalletDetails({
    wallets: walletAddresses,
    enabled: walletAddresses.length > 0,
  });

  const calculateTotalBalance = (
    wallets: UseQueryResult<WalletDetailsResponse, Error>[],
  ) => {
    let totalBalance = 0;
    wallets.forEach((wallet) => {
      if (wallet?.data?.[0]?.value?.walletUsd) {
        totalBalance += parseFloat(wallet?.data?.[0]?.value?.walletUsdAmt);
      }
    });

    return totalBalance;
  };

  return (
    <Box
      sx={{
        width: "400px",
        height: "500px",
        margin: "auto",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxShadow: "0 3px 10px rgba(0, 0, 0, 0.2)",
        borderRadius: 2,
      }}
    >
      {walletDetailsResult?.[0]?.isFetched ? (
        <TotalBallance
          totalBalance={calculateTotalBalance(walletDetailsResult)}
        />
      ) : (
        <Box
          sx={{
            paddingBottom: "2rem",
          }}
        >
          <Skeleton variant="rounded" width={100} height={30} />
        </Box>
      )}

      <Box
        sx={{
          display: "flex",
          justifyContent: "left",
          width: "100%",
          paddingBottom: "20px",
        }}
      >
        <Typography>Tokens</Typography>
      </Box>

      {walletDetailsResult &&
        walletDetailsResult.map((wallet) => {
          if (wallet?.data?.[0] && wallet?.data?.[0]?.symbol === "ETH") {
            return (
              <Box
                key={wallet?.data?.[0]?.address}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <TokenItem wallet={wallet?.data?.[0]} />
                <TokenItem wallet={wallet?.data?.[1]} />
              </Box>
            );
          } else if (wallet?.data?.[0]) {
            return (
              <Box
                key={wallet?.data?.[0]?.address}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <TokenItem wallet={wallet?.data?.[0]} />
              </Box>
            );
          }
        })}

      {!walletDetailsResult?.[0]?.isFetched && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            width: "100%",
            padding: "10px",
            gap: "10px",
          }}
        >
          <Skeleton variant="circular" width={48} height={20} />
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              gap: "10px",
              paddingLeft: "10px",
            }}
          >
            <Skeleton variant="rounded" width={"30%"} height={6} />
            <Skeleton variant="rounded" width={"30%"} height={6} />
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              width: "100%",
              gap: "10px",
              paddingLeft: "10px",
            }}
          >
            <Skeleton variant="rounded" width={"30%"} height={8} />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default WalletAccount;
