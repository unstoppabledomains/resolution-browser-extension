import type {IFireblocksNCW} from "@fireblocks/ncw-js-sdk";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type {Theme} from "@mui/material/styles";
import React from "react";

import {
  Status,
  useSubmitTransaction,
} from "../../../hooks/useSubmitTransaction";
import {OperationStatus} from "../OperationStatus";
import config from "../../../config";
import {makeStyles} from "@mui/styles";
import {SendCryptoStatusMessage} from "../../../api/fireblocksActions";
import useTranslationContext from "../../../i18n";
import {AccountAsset} from "../../../types";
import {Link} from "@mui/material";
import {getBlockchainSymbol} from "./SendConfirm";
import useGetAccountsList from "../../../api/useGetAccountsList";

const useStyles = makeStyles((theme: Theme) => ({
  fullWidth: {
    width: "100%",
  },
  sendLoadingContainer: {
    marginTop: theme.spacing(10),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    height: "100%",
    justifyContent: "space-between",
  },
  transactionStatusContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "7px",
    marginBottom: theme.spacing(5),
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

type Props = {
  onCloseClick: () => void;
  getClient: () => Promise<IFireblocksNCW>;
  asset: AccountAsset;
  recipientAddress: string;
  recipientDomain?: string;
  amount: string;
};

const truncateAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const SubmitTransaction: React.FC<Props> = ({
  onCloseClick,
  getClient,
  asset,
  recipientAddress,
  recipientDomain,
  amount,
}) => {
  const [t] = useTranslationContext();
  const classes = useStyles();

  const {data: accountsList} = useGetAccountsList({
    enabled: true,
  });

  asset.accountId = accountsList?.items[0].id;

  const {transactionId, status, statusMessage} = useSubmitTransaction({
    asset,
    recipientAddress,
    amount,
    getClient,
  });

  const visibleButtonStates = [
    SendCryptoStatusMessage.CHECKING_QUEUE,
    SendCryptoStatusMessage.STARTING_TRANSACTION,
    SendCryptoStatusMessage.WAITING_TO_SIGN,
    SendCryptoStatusMessage.WAITING_FOR_TRANSACTION,
    SendCryptoStatusMessage.TRANSACTION_COMPLETED,
  ];
  const closeButtonStates = [
    SendCryptoStatusMessage.WAITING_FOR_TRANSACTION,
    SendCryptoStatusMessage.TRANSACTION_COMPLETED,
  ];

  console.log("ASSET", asset);

  return (
    <Box className={classes.sendLoadingContainer}>
      <OperationStatus
        label={statusMessage}
        icon={<SendOutlinedIcon />}
        success={status === Status.Success}
        error={status === Status.Failed}
      >
        <Box className={classes.transactionStatusContainer} mt={2}>
          <Typography variant="caption"
            sx={{
              textAlign: "center",
            }}
          >
            {[Status.Success, Status.Failed].includes(status) &&
              t(
                `wallet.sendTransaction${
                  status === Status.Success ? "Success" : "Failed"
                }`,
                {
                  amount,
                  sourceSymbol: asset.blockchainAsset.symbol,
                  status,
                  recipientDomain: recipientDomain ? ` ${recipientDomain}` : "",
                  recipientAddress: truncateAddress(recipientAddress),
                },
              )}
          </Typography>
          {transactionId && (
            <Link
              variant={"caption"}
              target="_blank"
              href={`${
                config.BLOCKCHAINS[
                  getBlockchainSymbol(asset.blockchainAsset.blockchain.id)
                ].BLOCK_EXPLORER_TX_URL
              }${transactionId}`}
            >
              {t("wallet.viewTransaction")}
            </Link>
          )}
        </Box>
      </OperationStatus>
      {visibleButtonStates.includes(statusMessage) && (
        <Box className={classes.fullWidth}>
          <Button fullWidth onClick={onCloseClick} variant="outlined">
            {closeButtonStates.includes(statusMessage)
              ? t("common.close")
              : t("common.cancel")}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default SubmitTransaction;
