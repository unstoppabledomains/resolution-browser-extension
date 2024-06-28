import React from "react";
import BitcoinLogo from "jsx:../../assets/logos/bitcoin.svg";
import EthereumLogo from "jsx:../../assets/logos/ethereum.svg";
import MaticLogo from "jsx:../../assets/logos/matic.svg";
import {TokenSymbol} from "../../types";
import {Box} from "@mui/material";

type TokenLogoProps = {
  tokenSymbol: TokenSymbol;
};

const TokenLogo: React.FC<TokenLogoProps> = ({tokenSymbol}) => {
  let logo = null;
  switch (tokenSymbol) {
    case "ETH":
      logo = <EthereumLogo />;
      break;
    case "BTC":
      logo = <BitcoinLogo />;
      break;
    case "MATIC":
      logo = <MaticLogo />;
      break;
    default:
      logo = <EthereumLogo />;
  }

  return <Box>{logo}</Box>;
};

export default TokenLogo;
