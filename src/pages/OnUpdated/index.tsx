import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Markdown from "markdown-to-jsx";
import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import useAsyncEffect from "use-async-effect";

import {
  WalletIcon,
  getBootstrapState,
  useDomainConfig,
  useFireblocksState,
  useTranslationContext,
} from "@unstoppabledomains/ui-components";

import config from "../../config";
import usePreferences from "../../hooks/usePreferences";
import {getManifestVersion, signOut} from "../../lib/runtime";
import {setWalletPreferences} from "../../lib/wallet/preferences";
import {useExtensionStyles} from "../../styles/extension.styles";

const OnUpdated: React.FC = () => {
  const {classes, cx} = useExtensionStyles();
  const {setShowSuccessAnimation} = useDomainConfig();
  const [walletState, setWalletState] = useFireblocksState();
  const [isSignedOut, setIsSignedOut] = useState(false);
  const {preferences} = usePreferences();
  const [t] = useTranslationContext();
  const navigate = useNavigate();

  useAsyncEffect(async () => {
    // show the upgrade animation
    setShowSuccessAnimation(true);

    // sign out the user if specified by the config
    if (config.SIGN_OUT_ON_UPDATE) {
      const signInState = getBootstrapState(walletState);
      if (signInState?.refreshToken) {
        await signOut();
        await setWalletState({});
        setIsSignedOut(true);
      }
    }
  }, []);

  const handleClick = async () => {
    // ensure preferences are populated
    if (!preferences) {
      return;
    }

    // save updated default preferences
    preferences.DefaultView = "wallet";
    preferences.WalletEnabled = true;
    preferences.VersionInfo = config.VERSION_DESCRIPTION;

    // set existing wallet flag if signed out
    if (isSignedOut) {
      preferences.HasExistingWallet = true;
    }

    // save preferences and show the wallet
    await setWalletPreferences(preferences);
    navigate("/");
  };

  return (
    <Paper className={classes.container}>
      <Box className={cx(classes.walletContainer, classes.contentContainer)}>
        <Box
          className={cx(classes.contentContainer, classes.fullHeightCentered)}
        >
          <WalletIcon size={85} boxShadow={true} beta={true} />
          <Typography variant="h4" mt={2}>
            {t("extension.welcomeToVersion", {
              version: getManifestVersion() || "dev",
            })}
          </Typography>
          <Paper variant="outlined" className={classes.updatedContentContainer}>
            <Typography variant="body1">
              <Markdown>{config.VERSION_DESCRIPTION}</Markdown>
            </Typography>
          </Paper>
        </Box>
        <Box className={classes.contentContainer}>
          {isSignedOut && (
            <Box className={classes.contentContainer} mb={1}>
              <Alert variant="standard" severity="info" sx={{width: "100%"}}>
                You were signed during this upgrade.
              </Alert>
            </Box>
          )}
          <Button variant="contained" onClick={handleClick} fullWidth>
            {t("wallet.letsGo")}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default OnUpdated;
