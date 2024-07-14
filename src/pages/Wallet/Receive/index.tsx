import CheckIcon from "@mui/icons-material/CheckCircle";
import CopyIcon from "@mui/icons-material/ContentCopy";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type {Theme} from "@mui/material/styles";
import React, {useEffect, useRef, useState} from "react";
import {QRCode} from "react-qrcode-logo";

import {SelectAsset} from "../SelectAsset";
import type {TokenEntry} from "../Token";
import ManageInput from "../ManageInput";
import {makeStyles} from "@mui/styles";
import config from "../../../config";
import {SerializedWalletBalance} from "../../../types";

const useStyles = makeStyles((theme: Theme) => ({
  flexColCenterAligned: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
  },
  selectAssetContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minHeight: "250px",
    justifyContent: "space-between",
  },
  assetsContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 5,
    alignItems: "center",
  },
  asset: {
    backgroundImage: "linear-gradient(#0655DD, #043893)",
    borderRadius: 9,
    padding: 12,
    width: "100%",
  },
  assetLogo: {
    height: "60px",
    width: "60px",
    borderRadius: "50%",
    overflow: "hidden",
    marginTop: theme.spacing(1),
  },
  contentWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minHeight: "250px",
  },
  receiveAssetContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginTop: theme.spacing(3),
  },
  receiveContentContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  copyButton: {},
  addressWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  captionContainer: {
    display: "flex",
    backgroundColor: "#EEF0F3",
    padding: 10,
    borderRadius: 9,
  },
  infoIcon: {
    fontSize: 15,
  },
  learnMoreLink: {
    display: "inline-flex",
  },
  flex: {
    display: "flex",
  },
}));

type Props = {
  onCancelClick: () => void;
  wallets: SerializedWalletBalance[];
  setTitle: (title: string) => void;
};

const WalletReceive: React.FC<Props> = ({onCancelClick, wallets, setTitle}) => {
  const [asset, setAsset] = useState<TokenEntry>();
  const [copied, setCopied] = useState<boolean>(false);
  const classes = useStyles();
  const debounceTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (asset) {
      setTitle(`Receive ${asset.ticker}`);
    } else {
      setTitle("Select crypto to receive");
    }
  }, [asset]);

  const handleBackClick = () => {
    if (asset) {
      setAsset(undefined);
    } else {
      onCancelClick();
    }
  };

  if (!asset) {
    return (
      <Box className={classes.flexColCenterAligned}>
        <SelectAsset
          onSelectAsset={setAsset}
          wallets={wallets}
          onCancelClick={handleBackClick}
          label={"Select crypto to receive"}
          supportedTokenList={config.WALLETS.CHAINS.RECEIVE}
        />
      </Box>
    );
  }

  const handleCopyClick = () => {
    void navigator.clipboard.writeText(asset.walletAddress);
    setCopied(true);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  return (
    <Box className={classes.flexColCenterAligned}>
      <Box className={classes.contentWrapper}>
        <Box className={classes.receiveContentContainer}>
          <Box className={classes.receiveAssetContainer} mb={2}>
            <img src={asset.imageUrl} className={classes.assetLogo} />
          </Box>
          <QRCode
            value={`${asset.walletName}:${asset.walletAddress}`}
            size={110}
            logoOpacity={0.5}
            logoHeight={60}
            logoWidth={60}
            qrStyle={"dots"}
            ecLevel={"H"}
            eyeRadius={5}
            style={{height: 160, width: 160}}
          />
          <Box className={classes.addressWrapper} mt={2}>
            <ManageInput
              placeholder=""
              onChange={() => null}
              id="amount"
              value={asset.walletAddress}
              stacked={true}
              disabled
              multiline
              endAdornment={
                <Button
                  onClick={handleCopyClick}
                  className={classes.copyButton}
                >
                  {copied ? <CheckIcon color="success" /> : <CopyIcon />}
                </Button>
              }
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default WalletReceive;
