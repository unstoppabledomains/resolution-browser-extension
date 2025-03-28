import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import React from "react";

import {
  WalletIcon,
  useTranslationContext,
} from "@unstoppabledomains/ui-components";

import {useExtensionStyles} from "../../styles/extension.styles";

interface SignInCtaProps {
  onCreateWalletClicked: () => void;
  onSignInClicked: () => void;
}

export const SignInCta: React.FC<SignInCtaProps> = ({
  onCreateWalletClicked,
  onSignInClicked,
}) => {
  const {classes, cx} = useExtensionStyles();
  const [t] = useTranslationContext();

  return (
    <Paper className={classes.container}>
      <Box className={cx(classes.walletContainer, classes.contentContainer)}>
        <Box
          className={cx(classes.contentContainer, classes.fullHeightCentered)}
        >
          <WalletIcon size={100} boxShadow={true} beta={true} />
          <Typography
            className={classes.primaryText}
            variant="body1"
            mt={5}
            mr={2}
            ml={2}
          >
            {t("manage.cryptoWalletDescription")}
          </Typography>
        </Box>
        <Box className={classes.contentContainer}>
          <Button
            variant="contained"
            fullWidth
            className={cx(classes.button, classes.buttonPrimary)}
            onClick={onCreateWalletClicked}
          >
            {t("wallet.createWallet")}
          </Button>
          <Button
            variant="text"
            fullWidth
            size="small"
            className={classes.button}
            onClick={onSignInClicked}
          >
            {t("wallet.alreadyHaveWallet")}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};
