import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import type {Theme} from "@mui/material/styles";
import {round} from "lodash";
import React from "react";

import {makeStyles} from "@mui/styles";
import {AccountAsset} from "../../../types";

export const getBlockchainSymbol = (name: string): string => {
  switch (name.toUpperCase()) {
    case "ETHEREUM":
    case "ETH":
      return "ETH";
    case "POLYGON":
    case "MATIC":
      return "MATIC";
    case "BASE":
      return "BASE";
    case "BITCOIN":
    case "BTC":
      return "BTC";
    case "SOLANA":
    case "SOL":
      return "SOL";
    default:
      return name.toUpperCase();
  }
};

const useStyles = makeStyles((theme: Theme) => ({
  fullWidth: {
    width: "100%",
  },
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  contentContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    gap: "7px",
    marginBottom: theme.spacing(5),
    backgroundColor: theme.palette.primaryShades[100],
    padding: 12,
    borderRadius: 8,
    height: "100%",
  },
  icon: {
    fontSize: "60px",
  },
  subTitlePending: {
    marginTop: theme.spacing(1),
    color: "gray",
  },
  subTitleComplete: {
    marginTop: theme.spacing(1),
  },
}));

const MAX_DISPLAY_LENGTH = 12;

type Props = {
  onBackClick: () => void;
  onSendClick: () => void;
  recipientAddress: string;
  resolvedDomain: string;
  amount: string;
  symbol: string;
  asset: AccountAsset;
  gasFee: string;
  amountInDollars: string;
  blockchainName: string;
};

const truncateAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const SendConfirm: React.FC<Props> = ({
  onBackClick,
  recipientAddress,
  resolvedDomain,
  asset,
  amount,
  symbol,
  amountInDollars,
  blockchainName,
  onSendClick,
  gasFee,
}) => {
  const classes = useStyles();
  const maxDisplayLength = asset.balance?.decimals
    ? Math.min(MAX_DISPLAY_LENGTH, asset.balance.decimals)
    : MAX_DISPLAY_LENGTH;
  const assetSymbol = asset.blockchainAsset.symbol.toUpperCase();
  const gasSymbol = getBlockchainSymbol(
    asset.blockchainAsset.blockchain.id,
  ).toUpperCase();

  return (
    <Box className={classes.container}>
      <Box
        mt={2}
        display="flex"
        alignItems="center"
        flexDirection="column"
        width="100%"
        height="100%"
        justifyContent="space-between"
      >
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          width="100%"
        >
          <Typography variant="h4" textAlign="center">
            {amount} {symbol}
          </Typography>
          <Typography variant="subtitle1">{amountInDollars}</Typography>
          <Box className={classes.contentContainer} mt={3}>
            <Box
              display="flex"
              width="100%"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography variant="h6">To</Typography>
              <Typography variant="subtitle1">
                {resolvedDomain ? <b>{resolvedDomain} </b> : ""}(
                {truncateAddress(recipientAddress)})
              </Typography>
            </Box>
            <Box
              display="flex"
              width="100%"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography variant="h6">Network</Typography>
              <Typography variant="subtitle1">{blockchainName}</Typography>
            </Box>
            <Box
              display="flex"
              width="100%"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography variant="h6">Network fee</Typography>
              <Typography variant="subtitle1">
                {!gasFee ? (
                  <CircularProgress size={20} />
                ) : (
                  `${round(
                    parseFloat(gasFee),
                    maxDisplayLength,
                  )} ${getBlockchainSymbol(
                    asset.blockchainAsset.blockchain.id,
                  )}`
                )}
              </Typography>
            </Box>
            <Box display="flex" width="100%" justifyContent="space-between">
              <Typography variant="h6">Total cost</Typography>
              {assetSymbol === gasSymbol ? (
                <Typography variant="subtitle1">
                  {round(Number(amount) + Number(gasFee), maxDisplayLength)}{" "}
                  {assetSymbol}
                </Typography>
              ) : (
                <Box display="flex" flexDirection="column" textAlign="right">
                  <Typography variant="subtitle1">
                    {round(Number(amount), maxDisplayLength)} {assetSymbol}
                  </Typography>
                  <Typography variant="subtitle1">
                    {round(Number(gasFee), maxDisplayLength)} {gasSymbol}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
        <Button
          onClick={onSendClick}
          variant="contained"
          fullWidth
          data-testid="send-confirm-button"
        >
          Confirm
        </Button>
      </Box>
    </Box>
  );
};

export default SendConfirm;
