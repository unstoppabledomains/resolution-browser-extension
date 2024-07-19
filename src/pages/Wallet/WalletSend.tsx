import React from "react";
import {Box, IconButton, Typography} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {useLocation, useNavigate} from "react-router-dom";
import Send from "../../components/Wallet/Send";
import useGetAccountsList from "../../api/useGetAccountsList";
import useGetAccountsAssetsList from "../../api/useGetAccountsAssetsList";
import {Account, AccountAsset} from "../../types";

const WalletSend: React.FC = () => {
  const navigate = useNavigate();

  const location = useLocation();
  const {wallets} = location.state || {};

  const [title, setTitle] = React.useState<string>("Select crypto to send");

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
        width: "100%",
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
          <Typography variant="h5"
            sx={{
              textAlign: "center",
            }}
          >{title}</Typography>
        </Box>
        <Box
          sx={{
            width: "20px",
          }}
        ></Box>
      </Box>
      <Send
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

export default WalletSend;
