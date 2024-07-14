import React from "react";
import {Box, IconButton, Typography} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {useLocation, useNavigate} from "react-router-dom";
import Send from "./Send";
import useGetAccountsList from "../../api/useGetAccountsList";
import useGetAccountsAssetsList from "../../api/useGetAccountsAssetsList";
import {Account, AccountAsset} from "../../types";
import Receive from "./Receive";

const WalletReceive: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = React.useState<string>("Select crypto to receive");
  const location = useLocation();
  const {wallets} = location.state || {};

  const {data: accountsList} = useGetAccountsList({
    enabled: true,
  });

  const {data: accountsAssetsList, isFetched: isAccountsAssetsListFetched} =
    useGetAccountsAssetsList({
      accountId: accountsList?.items?.[0]?.id,
      enabled: !!accountsList,
    });

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
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <IconButton
            onClick={() => {
              navigate("/wallet");
            }}
            aria-label="back"
          >
            <ArrowBackIcon />
          </IconButton>
        </Box>
        <Box>
          <Typography variant="h5">{title}</Typography>
        </Box>
        <Box></Box>
      </Box>
      <Receive
        // getClient={getClient}
        // accessToken={accessToken}
        // onCancelClick={handleCancel}
        onCancelClick={() => {}}
        // onClickBuy={handleClickedBuy}
        // onClickReceive={handleClickedReceive}
        wallets={wallets}
        setTitle={setTitle}
      />
    </Box>
  );
};

export default WalletReceive;
