import Box from "@mui/material/Box";
import type {Theme} from "@mui/material/styles";
import {stringify} from "querystring";
import React from "react";

// import type {SerializedWalletBalance} from '../../lib';
import {SelectAsset} from "../SelectAsset";
import config from "../../../config";
import {makeStyles} from "@mui/styles";
import {SerializedWalletBalance, TokenEntry} from "../../../types";

const useStyles = makeStyles((theme: Theme) => ({
  flexColCenterAligned: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
  },
}));

type Props = {
  onCancelClick: () => void;
  wallets: SerializedWalletBalance[];
};

const Buy: React.FC<Props> = ({onCancelClick, wallets}) => {
  const classes = useStyles();

  const handleBuyRedirect = (asset: TokenEntry) => {
    const queryParams = stringify({
      blockchain: asset.name.toLowerCase(),
      address: asset.walletAddress,
      utm_source: "ud_me",
    });
    const url = `${config.UNSTOPPABLE_WEBSITE_URL}/fiat-ramps?${queryParams}`;
    window.open(url, "_blank");
  };

  return (
    <Box className={classes.flexColCenterAligned}>
      <SelectAsset
        onSelectAsset={handleBuyRedirect}
        wallets={wallets}
        onCancelClick={onCancelClick}
        label={"Select crypto to buy"}
        supportedTokenList={config.WALLETS.CHAINS.BUY}
      />
    </Box>
  );
};

export default Buy;
