import React from "react";
import BitcoinLogo from "jsx:../../assets/logos/bitcoin.svg";
import EthereumLogo from "jsx:../../assets/logos/ethereum.svg";
import MaticLogo from "jsx:../../assets/logos/matic.svg";
import SolanaLogo from "jsx:../../assets/logos/solana.svg";
import {TokenSymbol} from "../../types";
import {Box} from "@mui/material";

type TokenLogoProps = {
  tokenSymbol: TokenSymbol;
  className?: string;
};

const TokenLogo: React.FC<TokenLogoProps> = ({tokenSymbol, className}) => {
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
    case "SOL":
      logo = <SolanaLogo />;
      break;
    default:
      logo = <EthereumLogo />;
  }

  return <Box className={className}>{logo}</Box>;
};

export default TokenLogo;
