import SwapVertIcon from "@mui/icons-material/SwapVert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type {Theme} from "@mui/material/styles";
import React, {useState} from "react";

import {makeStyles} from "@mui/styles";
import ManageInput from "../ManageInput";
import {TokenEntry} from "../Token";

const useStyles = makeStyles((theme: Theme) => ({
  container: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "113px",
  },
  amountInputWrapper: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  availableBalance: {
    textAlign: "right",
    fontSize: "13px",
    marginTop: "2px",
  },
  swapCurrencyButton: {
    cursor: "pointer",
    "&:hover": {
      color: theme.palette.primary.main,
    },
  },
  swapIcon: {
    fontSize: "16px",
  },
}));

type Props = {
  initialAmount: string;
  amountInputRef: React.RefObject<HTMLInputElement>;
  token: TokenEntry;
  onTokenAmountChange: (tokenAmount: string) => void;
  gasFeeEstimate: string;
};

const AmountInput: React.FC<Props> = ({
  amountInputRef,
  initialAmount,
  token,
  onTokenAmountChange,
  gasFeeEstimate,
}) => {
  const [tokenAmount, setTokenAmount] = useState(initialAmount);
  const [fiatAmount, setFiatAmount] = useState("0");
  const [showFiat, setShowFiat] = useState(false);
  const classes = useStyles();

  const MaxAvailableAmount =
    token.balance - parseFloat(gasFeeEstimate) > 0
      ? token.balance - parseFloat(gasFeeEstimate)
      : 0;

  const convertToFiat = (value: string) => {
    if (!value || value === ".") {
      return "0.00";
    }
    return (parseFloat(value || "0") * token.tokenConversionUsd).toString();
  };

  const convertToToken = (value: string) => {
    if (!value || value === ".") {
      return "0";
    }
    return (parseFloat(value || "0") / token.tokenConversionUsd).toString();
  };

  const handleAmountChange = (id: string, value: string) => {
    const numberValue = Number(value);
    if ((isNaN(numberValue) || numberValue < 0) && value !== ".") {
      onTokenAmountChange("");
      return;
    }
    setTokenAmount(showFiat ? convertToToken(value) : value);
    setFiatAmount(showFiat ? value : convertToFiat(value));
    onTokenAmountChange(showFiat ? convertToToken(value) : value);
  };

  const toggleShowFiat = () => {
    setShowFiat(!showFiat);
    setFiatAmount(parseFloat(fiatAmount).toFixed(2));
    setTokenAmount(!tokenAmount ? "0" : tokenAmount);
  };

  const handleMaxClick = () => {
    setFiatAmount((MaxAvailableAmount * token.tokenConversionUsd).toFixed(2));
    setTokenAmount(MaxAvailableAmount.toString());
    onTokenAmountChange(MaxAvailableAmount.toString());
  };

  const insufficientBalance = parseFloat(tokenAmount) > MaxAvailableAmount;

  return (
    <Box className={classes.container}>
      <div className={classes.amountInputWrapper}>
        <ManageInput
          mt={2}
          id="amount"
          inputRef={amountInputRef}
          value={showFiat ? fiatAmount : tokenAmount}
          label={"Amount"}
          placeholder={`Amount in ${showFiat ? "USD" : token.ticker}`}
          onChange={handleAmountChange}
          stacked={true}
          error={insufficientBalance}
          errorText={insufficientBalance ? "Insufficient balance" : ""}
          endAdornment={
            <Button onClick={handleMaxClick} data-testid="max-amount-button">
              Max
            </Button>
          }
        />
      </div>
      {!insufficientBalance && (
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          data-testid="swap-balance-container"
        >
          <Typography
            variant="caption"
            onClick={toggleShowFiat}
            display="flex"
            alignItems="center"
            className={classes.swapCurrencyButton}
            data-testid="swap-currency-button"
          >
            {!showFiat
              ? `~$${parseFloat(fiatAmount).toFixed(2)}`
              : `${parseFloat(tokenAmount).toFixed(5)} ${token.ticker}`}
            <SwapVertIcon className={classes.swapIcon} />
          </Typography>
          <Typography variant="subtitle1" className={classes.availableBalance}>
            {showFiat
              ? `Available ${(
                  MaxAvailableAmount * token.tokenConversionUsd
                ).toFixed(2)})`
              : `Available ${MaxAvailableAmount.toFixed(5)} ${token.ticker}`}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default AmountInput;
