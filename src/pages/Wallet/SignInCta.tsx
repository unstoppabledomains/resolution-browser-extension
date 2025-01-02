import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import React from "react";

import {AppEnv} from "@unstoppabledomains/config";
import {useTranslationContext} from "@unstoppabledomains/ui-components";
import IconPlate from "@unstoppabledomains/ui-kit/icons/IconPlate";
import UnstoppableWalletIcon from "@unstoppabledomains/ui-kit/icons/UnstoppableWalletIcon";

import config from "../../config";
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
          <IconPlate size={100} variant="info">
            <UnstoppableWalletIcon />
          </IconPlate>
          <Typography variant="h4" mt={3}>
            {t("wallet.title")}
          </Typography>
          <Typography variant="body1" mt={1} mb={2}>
            {t("manage.cryptoWalletDescriptionShort")}
          </Typography>
          {(config.NODE_ENV as AppEnv) !== "production" && (
            <Chip
              variant="filled"
              label={config.NODE_ENV}
              color="warning"
              size="small"
            />
          )}
        </Box>
        <Box className={classes.contentContainer}>
          <Button
            variant="contained"
            fullWidth
            className={classes.button}
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
