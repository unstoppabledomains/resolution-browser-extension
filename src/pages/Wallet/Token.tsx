import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import PhotoLibraryOutlinedIcon from "@mui/icons-material/PhotoLibraryOutlined";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import type {Theme} from "@mui/material/styles";
import {makeStyles, useTheme} from "@mui/styles";
import React from "react";

import {
  CurrenciesType,
  SerializedPriceHistory,
  TokenSymbol,
  TokenType,
} from "../../types";
import TokenLogo from "./TokenLogo";

type StyleProps = {
  palletteShade: Record<number, string>;
};

const useStyles = makeStyles((theme: Theme) => ({
  chartContainer: {
    height: "40px",
    display: "flex",
    justifyContent: "center",
  },
  portfolioContainer: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
  },
  txTitle: {
    fontWeight: "bold",
    color: "white",
  },
  txBalance: {
    fontWeight: "bold",
    color: "white",
    whiteSpace: "nowrap",
  },
  txSubTitle: {
    color: "white",
  },
  txLink: {
    cursor: "pointer",
  },
  txPctChangeDown: {
    color: "red",
    fontWeight: "600",
  },
  txPctChangeNeutral: {
    color: "gray",
    fontWeight: "600",
  },
  txPctChangeUp: {
    color: theme.palette.success.main,
    fontWeight: "600",
  },
  nftCollectionIcon: {
    borderRadius: theme.shape.borderRadius,
    width: "40px",
    height: "40px",
  },
  tokenIcon: {
    borderRadius: "50%",
    width: "40px",
    height: "40px",
  },
  tokenIconDefault: {
    borderRadius: "50%",
    backgroundColor: theme.palette.primary.main,
    color: "white",
    width: "40px",
    height: "40px",
  },
  chainIcon: {
    color: theme.palette.common.black,
    backgroundColor: "white",
    border: `1px solid black`,
    borderRadius: "50%",
    width: "17px",
    height: "17px",
  },
}));

export type TokenEntry = {
  type: TokenType;
  symbol: string;
  name: string;
  ticker: string;
  value: number;
  tokenConversionUsd: number;
  balance: number;
  pctChange?: number;
  imageUrl?: string;
  history?: SerializedPriceHistory[];
  walletAddress: string;
  walletBlockChainLink: string;
  walletName: string;
  walletType?: string;
};

type Props = {
  token: TokenEntry;
  onClick: () => void;
  primaryShade: boolean;
  showGraph?: boolean;
  hideBalance?: boolean;
};

const bgNeutralShade = 800;

const Token: React.FC<Props> = ({
  token,
  onClick,
  primaryShade,
  showGraph,
  hideBalance,
}) => {
  const theme = useTheme();
  const classes = useStyles();

  return (
    <Grid
      container
      item
      xs={12}
      onClick={onClick}
      className={classes.txLink}
      data-testid={`token-${token.symbol}`}
    >
      <Grid item xs={2}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          textAlign="left"
        >
          <Badge
            overlap="circular"
            anchorOrigin={{vertical: "bottom", horizontal: "right"}}
            badgeContent={
              token.type === TokenType.Native ? null : (
                <TokenLogo
                  className={classes.tokenIcon}
                  tokenSymbol={token.symbol as TokenSymbol}
                />
              )
            }
          >
            {token.type === TokenType.Native ? (
              <TokenLogo
                className={classes.tokenIcon}
                tokenSymbol={token.symbol as TokenSymbol}
              />
            ) : token.imageUrl ? (
              <img
                src={token.imageUrl}
                className={
                  token.type === TokenType.Nft
                    ? classes.nftCollectionIcon
                    : classes.tokenIcon
                }
              />
            ) : token.type === TokenType.Nft ? (
              <PhotoLibraryOutlinedIcon
                sx={{padding: 0.5}}
                className={classes.tokenIconDefault}
              />
            ) : (
              <MonetizationOnOutlinedIcon
                className={classes.tokenIconDefault}
              />
            )}
          </Badge>
        </Box>
      </Grid>
      <Grid item xs={4}>
        <Box display="flex" flexDirection="column">
          <Typography variant="caption" className={classes.txTitle}>
            {token.name}
          </Typography>
          <Typography variant="caption" className={classes.txSubTitle}>
            {!hideBalance && token.balance.toFixed(6)}{" "}
            {token.type === TokenType.Nft
              ? `NFT${token.balance === 1 ? "" : "s"}`
              : token.ticker}
          </Typography>
        </Box>
      </Grid>
      <Grid item xs={4}></Grid>
      <Grid item xs={2}>
        {!hideBalance && (
          <Box
            display="flex"
            flexDirection="column"
            textAlign="right"
            justifyContent="right"
            justifyItems="right"
          >
            <Typography variant="caption" className={classes.txBalance}>
              {token.value.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}
            </Typography>
            <Typography
              variant="caption"
              className={
                !token.pctChange
                  ? classes.txPctChangeNeutral
                  : token.pctChange < 0
                    ? classes.txPctChangeDown
                    : classes.txPctChangeUp
              }
            >
              {token.pctChange
                ? `${token.pctChange > 0 ? "+" : ""}${token.pctChange.toFixed(4)}%`
                : `---`}
            </Typography>
          </Box>
        )}
      </Grid>
    </Grid>
  );
};

export default Token;
