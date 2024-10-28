import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import {useExtensionStyles} from "../../styles/extension.styles";
import {useTranslationContext} from "@unstoppabledomains/ui-components";
import IconPlate from "@unstoppabledomains/ui-kit/icons/IconPlate";
import UnstoppableWalletIcon from "@unstoppabledomains/ui-kit/icons/UnstoppableWalletIcon";
import config from "../../config";
import {AppEnv} from "@unstoppabledomains/config";
import {setBadgeCount} from "../../lib/runtime";
import {openPopupWindow} from "../../scripts/liteWalletProvider/background";

interface SignInCtaProps {
  onSignInClick: () => Promise<void>;
}

export const SignInCta: React.FC<SignInCtaProps> = ({onSignInClick}) => {
  const {classes, cx} = useExtensionStyles();
  const [t] = useTranslationContext();

  const handleSignIn = async (newUser: boolean) => {
    // handle the callback before opening the new window
    await onSignInClick();

    // find current window
    const parentWindow = await chrome.windows.getLastFocused();

    // determine the popup URL
    const popupUrl = chrome.runtime.getURL(
      `index.html?request=${encodeURIComponent(JSON.stringify({type: "signInRequest", params: [newUser]}))}&parentWindowId=${parentWindow.id}#connect`,
    );

    // open the popup
    await openPopupWindow(popupUrl, parentWindow.id);

    // set a badge
    await setBadgeCount(1);

    // close the existing extension popup
    chrome.extension.getViews({type: "popup"}).map((w) => w.close());
  };

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
            onClick={() => handleSignIn(false)}
          >
            {t("wallet.beginSetup")}
          </Button>
          <Button
            variant="outlined"
            fullWidth
            className={classes.button}
            onClick={() => handleSignIn(true)}
          >
            {t("wallet.createWallet")}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};
