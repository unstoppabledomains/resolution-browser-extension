import React, {useEffect, useState} from "react";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Divider,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {useExtensionStyles} from "../../styles/extension.styles";
import {WalletPreferences} from "../../types/wallet/preferences";
import {
  getWalletPreferences,
  setWalletPreferences,
} from "../../lib/wallet/preferences";
import {
  useTranslationContext,
  TitleWithBackButton,
  Link,
} from "@unstoppabledomains/ui-components";
import {ConnectedSites} from "../../types/wallet/connection";
import {
  clearAllConnectedSites,
  getConnectedSites,
} from "../../lib/wallet/evm/connection";
import MainScreen from "../ExtensionMain/MainScreen";

interface PreferencesProps {
  onClose: () => void;
}

export const Preferences: React.FC<PreferencesProps> = ({onClose}) => {
  const {classes, cx} = useExtensionStyles();
  const [t] = useTranslationContext();
  const [preferences, setPreferences] = useState<WalletPreferences>();
  const [connections, setConnections] = useState<ConnectedSites>();

  useEffect(() => {
    const loadPreferences = async () => {
      // load connections
      setConnections(await getConnectedSites());

      // load preferences
      setPreferences(await getWalletPreferences());
    };
    void loadPreferences();
  }, []);

  const handleCompatibilityMode = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    preferences.OverrideMetamask = event.target.checked;
    setPreferences({...preferences});
    await setWalletPreferences(preferences);
  };

  const handleDisconnectAll = async () => {
    await clearAllConnectedSites();
    setConnections({});
  };

  return (
    <Paper className={cx(classes.container, classes.preferenceContainer)}>
      <Box className={cx(classes.walletContainer, classes.contentContainer)}>
        <Box className={classes.contentContainer}>
          <TitleWithBackButton
            variant="h4"
            label={t("push.settings")}
            onCancelClick={onClose}
          />
          {!preferences ? (
            <Box
              className={cx(classes.walletContainer, classes.contentContainer)}
            >
              <CircularProgress className={classes.loadingSpinner} />
            </Box>
          ) : (
            <Box className={classes.contentContainer} mb={1}>
              <PreferenceSection
                title="Compatibility mode"
                description="Unstoppable Lite Wallet can override MetaMask in apps to ensure maximum compatibility. Enabling this setting may interfere with other extensions."
              >
                <FormControlLabel
                  label="Enable compatibility mode"
                  control={
                    <Checkbox
                      checked={preferences.OverrideMetamask}
                      onChange={handleCompatibilityMode}
                    />
                  }
                />
              </PreferenceSection>
              <PreferenceSection
                title="Connections"
                description={
                  connections && Object.keys(connections).length > 0
                    ? "You have authorized the following websites to connect to Unstoppable Lite Wallet."
                    : "No authorized connections"
                }
              >
                {connections &&
                  Object.keys(connections)
                    .sort((a, b) => a.localeCompare(b))
                    .map((site) => (
                      <Link href={`https://${site}`} target="_blank">
                        <Typography variant="caption">{site}</Typography>
                      </Link>
                    ))}
                {connections && Object.keys(connections).length > 0 && (
                  <Box display="flex" width="100%" mt={1} mb={2}>
                    <Button
                      variant="outlined"
                      onClick={handleDisconnectAll}
                      className={classes.button}
                      fullWidth
                      size="small"
                    >
                      Disconnect all
                    </Button>
                  </Box>
                )}
              </PreferenceSection>
              <PreferenceSection
                title="Decentralized Browsing"
                description="Level up your browser by resolving onchain domains. Names like lisa.x or sandy.nft can be looked up using the DNS alternatives configured below."
              >
                <Box display="flex" width="100%" mt={1}>
                  <MainScreen hideUserId={true} />
                </Box>
              </PreferenceSection>
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

interface PreferenceSectionProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

const PreferenceSection: React.FC<PreferenceSectionProps> = ({
  title,
  description,
  children,
}) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="left"
      justifyContent="left"
      textAlign="left"
      width="100%"
      mt={3}
    >
      <Typography variant="h6">{title}</Typography>
      <Divider />
      <Typography variant="body2" mb={1} mt={1}>
        {description}
      </Typography>
      {children}
    </Box>
  );
};
