import React from "react";
import {Box, Typography} from "@mui/material";
import {styled} from "@mui/material/styles";
import TokenLogo from "./TokenLogo";
import {TokenSymbol} from "../../types";
import {WalletDetailsResponse} from "../../api/useGetWalletDetails";

const TokenItemBox = styled(Box)({
  display: "flex",
  width: "100%",
  justifyContent: "space-between",
  paddingBottom: "2rem",
});

const TokenInfoBox = styled(Box)({
  display: "flex",
  alignItems: "center",
});

const TokenDetailsBox = styled(Box)({
  paddingLeft: "1rem",
});

const TokenNameText = styled(Typography)({
  fontWeight: 400,
});

const TokenAmountText = styled(Typography)({
  color: "#85858E",
  fontSize: "0.9rem",
});

const TokenInfoRigthBox = styled(Box)({
  display: "flex",
  alignItems: "right",
});

const TokenFiatAmountText = styled(Typography)({
  paddingTop: "0.5rem",
});

type TokenItemProps = {
  wallet: WalletDetailsResponse;
};

const TokenItem: React.FC<TokenItemProps> = ({wallet}) => {
  return (
    <TokenItemBox>
      {wallet && (
        <>
          <TokenInfoBox>
            <TokenLogo tokenSymbol={wallet.symbol as TokenSymbol} />
            <TokenDetailsBox>
              <TokenNameText>{wallet.name}</TokenNameText>
              <TokenAmountText>
                {wallet.symbol == "BTC"
                  ? Number(wallet.totalValueUsdAmt).toPrecision(4)
                  : Number(wallet.balance).toPrecision(4) || 0}{" "}
                {wallet.symbol}
              </TokenAmountText>
            </TokenDetailsBox>
          </TokenInfoBox>
          <TokenInfoRigthBox>
            <TokenFiatAmountText>{wallet.value.walletUsd}</TokenFiatAmountText>
          </TokenInfoRigthBox>
        </>
      )}
    </TokenItemBox>
  );
};

export default TokenItem;
