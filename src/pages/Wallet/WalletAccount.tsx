import React, {useEffect, useState} from "react";
import {Box, Skeleton, Theme, Typography} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import {makeStyles} from "@mui/styles";
import useGetAccountsList, {
  AccountsListResponse,
} from "../../api/useGetAccountsList";
import useGetAccountsAssetsList from "../../api/useGetAccountsAssetsList";
import TokenItem from "../../components/Wallet/TokenItem";
import useGetWalletDetails, {
  WalletDetailsResponse,
} from "../../api/useGetWalletDetails";
import {uniqueArray} from "../../util/helpers";
import TotalBallance from "../../components/Wallet/TotalBallance";
import {useNavigate} from "react-router-dom";
import {Header} from "../../components/Wallet/Header";

type WalletAccountProps = {
  accountsList: AccountsListResponse;
};

const useStyles = makeStyles((theme: Theme) => ({
  mainActionsContainer: {
    display: "flex",
    justifyContent: "center",
    width: "100%",
    paddingBottom: "10px",
  },
  actionContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    // backgroundColor: theme.palette.primaryShades[100],
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    marginRight: theme.spacing(2),
    width: "100px",
    cursor: "pointer",
    [theme.breakpoints.down("sm")]: {
      width: "70px",
    },
  },
  actionIcon: {
    color: theme.palette.primary.main,
    width: "50px",
    height: "50px",
    [theme.breakpoints.down("sm")]: {
      width: "35px",
      height: "35px",
    },
  },
  actionText: {
    color: theme.palette.primary.main,
  },
}));

const WalletAccount: React.FC<WalletAccountProps> = () => {
  const classes = useStyles();
  const navigate = useNavigate();

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

  const calculateTotalBalance = (wallets: WalletDetailsResponse[]) => {
    let totalBalance = 0;
    wallets.forEach((wallet) => {
      totalBalance += wallet?.totalValueUsdAmt;
    });

    return totalBalance.toFixed(2);
  };

  const handleClickedSend = () => {
    if (!walletDetailsResult.isFetched) return;
    navigate("/wallet/send", {state: {wallets: walletDetailsResult.data}});
  };
  const handleClickedReceive = () => {
    if (!walletDetailsResult.isFetched) return;
    navigate("/wallet/receive", {state: {wallets: walletDetailsResult.data}});
  };
  const handleClickedBuy = () => {
    if (!walletDetailsResult.isFetched) return;
    navigate("/wallet/buy", {state: {wallets: walletDetailsResult.data}});
  };

  const [isLoaded, setIsLoaded] = useState(false);
  const [isFetching, setIsFetching] = useState<boolean>();
  const [isHeaderClicked, setIsHeaderClicked] = useState(false);

  return (
    <Box
      sx={{
        width: "100%",
      }}
    >
      <Header
        mode={"portfolio"}
        isLoaded={isLoaded}
        isFetching={isFetching}
        avatarUrl={undefined}
        showMessages={false}
        address={""}
        accessToken={""}
        emailAddress={""}
        onHeaderClick={() => setIsHeaderClicked(true)}
        domain={undefined}
      />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          paddingTop: "20px",
        }}
      >
        {walletDetailsResult.isFetched ? (
          <TotalBallance
            totalBalance={calculateTotalBalance(walletDetailsResult.data)}
          />
        ) : (
          <Box
            sx={{
              paddingBottom: "1rem",
            }}
          >
            <Skeleton variant="rounded" width={100} height={30} />
          </Box>
        )}
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          paddingBottom: "20px",
        }}
      >
        <Box className={classes.mainActionsContainer}>
          <Box className={classes.actionContainer} onClick={handleClickedSend}>
            <SendIcon className={classes.actionIcon} />
            <Typography className={classes.actionText}>Send</Typography>
          </Box>
          <Box
            className={classes.actionContainer}
            onClick={handleClickedReceive}
          >
            <AddOutlinedIcon className={classes.actionIcon} />
            <Typography className={classes.actionText}>Receive</Typography>
          </Box>
          <Box mr={-2}>
            <Box className={classes.actionContainer} onClick={handleClickedBuy}>
              <AttachMoneyIcon className={classes.actionIcon} />
              <Typography className={classes.actionText}>Buy</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          width: "100%",
        }}
      >
        {walletDetailsResult &&
          walletDetailsResult.data.map((wallet, idx) => {
            return (
              <Box key={idx}>
                <TokenItem wallet={wallet} />
              </Box>
            );
          })}
      </Box>

      {!walletDetailsResult.isFetched && (
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
