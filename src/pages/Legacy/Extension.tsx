import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import React from "react";

import {useTranslationContext} from "@unstoppabledomains/ui-components";

import Footer from "../../components/Footer";
import Header from "../../components/Header";
import usePreferences from "../../hooks/usePreferences";
import {
  getDefaultPreferences,
  setWalletPreferences,
} from "../../lib/wallet/preferences";
import {useExtensionStyles} from "../../styles/extension.styles";
import {PreferenceSection} from "../Wallet/Preferences";
import MainScreen from "./MainScreen";

const styles = {
  topLayout: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    height: "100%",
  },
  middleLayout: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
};

const Extension: React.FC = () => {
  const [t] = useTranslationContext();
  const {classes} = useExtensionStyles();
  const {preferences, setPreferences} = usePreferences();

  const handleSherlockAssistant = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!preferences) {
      return;
    }

    // initialize scanning preferences if required
    if (!preferences.Scanning) {
      const defaultPreferences = getDefaultPreferences();
      preferences.Scanning = defaultPreferences.Scanning;
    }

    // set the sherlock assistant preference
    preferences.Scanning.Enabled = event.target.checked;
    setPreferences({...preferences});
    await setWalletPreferences(preferences);
  };

  if (!preferences) {
    return null;
  }

  return (
    <Paper className={classes.container}>
      <Box sx={styles.topLayout}>
        <Box sx={styles.middleLayout}>
          <Header iconPath="icon/browser.svg" />
          <Box className={classes.mainScreenContainer}>
            <Box display="flex" flexDirection="column" height="100%">
              <Box mt={-4}>
                <PreferenceSection
                  title={t("extension.sherlockAssistant")}
                  description={t("extension.sherlockAssistantDescription")}
                >
                  <FormControlLabel
                    label={`${t("manage.enable")} ${t("extension.sherlockAssistant")}`}
                    control={
                      <Checkbox
                        checked={preferences?.Scanning?.Enabled}
                        onChange={handleSherlockAssistant}
                      />
                    }
                  />
                </PreferenceSection>
              </Box>
              <PreferenceSection
                title={t("extension.decentralizedBrowsing")}
                description=""
              >
                <MainScreen hideUserId />
              </PreferenceSection>
            </Box>
          </Box>
        </Box>
        <Box className={classes.footerContainer}>
          <Footer />
        </Box>
      </Box>
    </Paper>
  );
};

export default Extension;
