import React from "react";
import {Box, Button, Chip, Paper, Typography} from "@mui/material";
import {useExtensionStyles} from "../../styles/extension.styles";
import {setWalletPreferences} from "../../lib/wallet/preferences";
import {useNavigate} from "react-router-dom";
import {DefaultPageView} from "../../types/wallet/preferences";
import Animation from "react-canvas-confetti/dist/presets/fireworks";
import Markdown from "markdown-to-jsx";
import config from "../../config";
import usePreferences from "../../hooks/usePreferences";
import {getManifestVersion} from "../../lib/runtime";
import {useTranslationContext} from "@unstoppabledomains/ui-components";
import {AppEnv} from "@unstoppabledomains/config";

const OnUpdated: React.FC = () => {
  const {classes, cx} = useExtensionStyles();
  const {preferences} = usePreferences();
  const [t] = useTranslationContext();
  const navigate = useNavigate();

  const handleOptOut = async () => {
    await handlePreference("legacy");
  };

  const handleUseWallet = async () => {
    await handlePreference("wallet");
  };

  const handlePreference = async (view: DefaultPageView) => {
    preferences.DefaultView = view;
    preferences.WalletEnabled = view === "wallet";
    preferences.Version = getManifestVersion();
    await setWalletPreferences(preferences);
    navigate("/");
  };

  return (
    <Paper className={classes.container}>
      <Animation autorun={{speed: 3, duration: 1}} />
      <Box className={cx(classes.walletContainer, classes.contentContainer)}>
        <Box
          className={cx(classes.contentContainer, classes.fullHeightCentered)}
        >
          <img src={chrome.runtime.getURL("/icon/browser.svg")} />
          <Typography variant="h4" mt={1}>
            {t("extension.welcomeToVersion", {version: getManifestVersion()})}
          </Typography>
          <Paper variant="outlined" className={classes.updatedContentContainer}>
            <Typography variant="body1">
              <Markdown>{config.VERSION_DESCRIPTION}</Markdown>
            </Typography>
          </Paper>
          {(config.NODE_ENV as AppEnv) !== "production" && (
            <Box mt={2}>
              <Chip
                variant="filled"
                label={config.NODE_ENV}
                color="warning"
                size="small"
              />
            </Box>
          )}
        </Box>
        <Box className={classes.contentContainer}>
          {preferences?.WalletEnabled ? (
            <Button variant="contained" onClick={handleUseWallet} fullWidth>
              {t("common.continue")}
            </Button>
          ) : (
            <>
              <Button variant="contained" onClick={handleUseWallet} fullWidth>
                {t("extension.enableWallet")}
              </Button>
              <Box className={classes.contentContainer} mt={1}>
                <Button variant="text" onClick={handleOptOut} size="small">
                  {t("extension.continueWithoutWallet")}
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default OnUpdated;
