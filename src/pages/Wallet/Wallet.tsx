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
import {Wallet} from "@unstoppabledomains/ui-components";

const WalletComp: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [walletState, setWalletState] = useState<WalletState>(WalletState.Load);
  const navigate = useNavigate();

  const [getAccountsListEnable, setGetAccountsListEnable] = useState(false);
  const {
    data: accountsList,
    isSuccess: isAccountsListSuccess,
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
      <Wallet
        address="0x1234567890"
        domain="example.crypto"
        setButtonComponent={() => {}}
        onUpdate={() => {}}
      />
      {/* {walletState === WalletState.Load && <CircularProgress />}
      {walletState === WalletState.Onboard && (
        <SetupYourNewWallet
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
        />
      )}
      {walletState === WalletState.Account && (
        <WalletAccount accountsList={accountsList} />
      )} */}
    </Box>
  );
};

export default WalletComp;
