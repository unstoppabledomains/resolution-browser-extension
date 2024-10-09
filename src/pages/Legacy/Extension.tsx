import React from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import MainScreen from "./MainScreen";
import Paper from "@mui/material/Paper";
import Checkbox from "@mui/material/Checkbox";

import FormControlLabel from "@mui/material/FormControlLabel";
import Box from "@mui/material/Box";
import {useExtensionStyles} from "../../styles/extension.styles";
import {PreferenceSection} from "../Wallet/Preferences";
import usePreferences from "../../hooks/usePreferences";
import {
  getDefaultPreferences,
  setWalletPreferences,
} from "../../lib/wallet/preferences";
import {useTranslationContext} from "@unstoppabledomains/ui-components";

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

interface Props {}

const Extension: React.FC<Props> = () => {
  const [t] = useTranslationContext();
  const {classes} = useExtensionStyles();
  const {preferences, setPreferences} = usePreferences();

  const handleSherlockAssistant = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
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
                <MainScreen hideUserId={true} />
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
