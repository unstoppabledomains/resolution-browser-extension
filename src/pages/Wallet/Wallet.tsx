import React, {useEffect, useState} from "react";
import {Box} from "@mui/material";
import SetupYourNewWallet from "../../components/Wallet/SetupYourNewWallet";
import useGetAccountsList from "../../api/useGetAccountsList";
import {
  StorageSyncKey,
  chromeStorageSyncGet,
} from "../../util/chromeStorageSync";
import {WalletState} from "../../types";
import {useNavigate} from "react-router-dom";
import useWalletState from "../../hooks/useWalletState";

const Wallet: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const {walletState, isLoadingWalletState, updateWalletState} =
    useWalletState();
  const [getAccountsListEnable, setGetAccountsListEnable] = useState(false);

  const navigate = useNavigate();

  const {
    data: accountsList,
    isSuccess: isAccountsListSuccess,
    isPending: isAccountsListLoading,
  } = useGetAccountsList({
    enabled: getAccountsListEnable,
  });

  useEffect(() => {
    if (walletState.state === WalletState.Account) {
      navigate("/wallet/account");
    }
  }, [walletState.state]);

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
        console.log("Loading...");
      } else if (isAccountsListSuccess && accountsList.items.length > 0) {
        navigate("/wallet/account");
      }
    } else {
      if (!isLoadingWalletState) {
        updateWalletState(walletState.state);
      }
    }
  }, [
    isAccountsListSuccess,
    isAccountsListLoading,
    getAccountsListEnable,
    isLoadingWalletState,
  ]);

  return (
    <Box>
      {(walletState.state === WalletState.EmailAndPassword ||
        walletState.state === WalletState.VerifyEmail) && (
        <SetupYourNewWallet
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          walletState={walletState}
          updateWalletState={updateWalletState}
        />
      )}
    </Box>
  );
};

export default Wallet;
