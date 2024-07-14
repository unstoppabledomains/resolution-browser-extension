import React from "react";
import {Box, IconButton, Typography} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {useLocation, useNavigate} from "react-router-dom";
import Buy from "./Buy";
import useGetAccountsList from "../../api/useGetAccountsList";
import useGetAccountsAssetsList from "../../api/useGetAccountsAssetsList";
import {Account, AccountAsset} from "../../types";

const WalletBuy: React.FC = () => {
  const navigate = useNavigate();

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

  const handleCancel = () => {};

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
          <Typography variant="h5">Select crypto to buy</Typography>
        </Box>
        <Box></Box>
      </Box>
      <Buy onCancelClick={handleCancel} wallets={wallets} />
    </Box>
  );
};

export default WalletBuy;
