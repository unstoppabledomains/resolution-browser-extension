import React, {useEffect, useState} from "react";
import {Box, CircularProgress} from "@mui/material";
import SetupYourNewWallet from "./SetupYourNewWallet";
import WalletAccount from "./WalletAccount";
import useGetAccountsList from "../../api/useGetAccountsList";
import {
  StorageSyncKey,
  chromeStorageSyncGet,
} from "../../util/chromeStorageSync";
import {WalletState} from "../../types";
import {useNavigate} from "react-router-dom";
import useGetWalletDetails from "../../api/useGetWalletDetails";
import useGetAccountsAssetsList from "../../api/useGetAccountsAssetsList";
import {uniqueArray} from "../../util/helpers";

const Wallet: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [walletState, setWalletState] = useState<WalletState>(WalletState.Load);
  const [walletAddresses, setWalletAddresses] = React.useState<string[]>([]);

  const navigate = useNavigate();

  const [getAccountsListEnable, setGetAccountsListEnable] = useState(false);
  const {
    data: accountsList,
    isSuccess: isAccountsListSuccess,
    isFetched: isAccountsListFetched,
    isPending: isAccountsListLoading,
  } = useGetAccountsList({
    enabled: getAccountsListEnable,
  });

  useEffect(() => {
    const getAccessToken = async () => {
      let accessToken: string;
      try {
        accessToken = await chromeStorageSyncGet(StorageSyncKey.AccessToken);
      } catch (e) {}
      return accessToken;
    };

    const checkAccessState = async () => {
      const accessToken = await getAccessToken();
      if (accessToken) {
        setGetAccountsListEnable(true);
      } else {
        setGetAccountsListEnable(false);
      }
    };

    checkAccessState();
  }, []);

  useEffect(() => {
    if (getAccountsListEnable) {
      if (isAccountsListLoading) {
        setWalletState(WalletState.Load);
      } else if (isAccountsListSuccess && accountsList.items.length > 0) {
        navigate("/wallet/account");
      }
    } else {
      setWalletState(WalletState.Onboard);
    }
  }, [isAccountsListSuccess, isAccountsListLoading, getAccountsListEnable]);

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
      {walletState === WalletState.Load && <CircularProgress />}
      {walletState === WalletState.Onboard && (
        <SetupYourNewWallet
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
        />
      )}
    </Box>
  );
};

export default Wallet;
