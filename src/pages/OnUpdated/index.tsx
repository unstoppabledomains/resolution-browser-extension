import React from "react";
import {Box, Button, Paper, Typography} from "@mui/material";
import {useExtensionStyles} from "../../styles/extension.styles";
import {setWalletPreferences} from "../../lib/wallet/preferences";
import {useNavigate} from "react-router-dom";
import {DefaultPageView} from "../../types/wallet/preferences";
import Animation from "react-canvas-confetti/dist/presets/fireworks";
import Markdown from "markdown-to-jsx";
import config from "../../config";
import usePreferences from "../../hooks/usePreferences";
import {getManifestVersion} from "../../lib/runtime";

interface Props {}

const OnUpdated: React.FC<Props> = () => {
  const {classes, cx} = useExtensionStyles();
  const {preferences} = usePreferences();
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
            Welcome to version {getManifestVersion()}!
          </Typography>
          <Paper variant="outlined" className={classes.updatedContentContainer}>
            <Typography variant="body1">
              <Markdown>{config.VERSION_DESCRIPTION}</Markdown>
            </Typography>
          </Paper>
        </Box>
        <Box className={classes.contentContainer}>
          {preferences?.WalletEnabled ? (
            <Button variant="contained" onClick={handleUseWallet} fullWidth>
              Continue
            </Button>
          ) : (
            <>
              <Button variant="contained" onClick={handleUseWallet} fullWidth>
                Enable Wallet Features
              </Button>
              <Box className={classes.contentContainer} mt={1}>
                <Button variant="text" onClick={handleOptOut} size="small">
                  Continue without wallet
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
