import React, {useEffect, useState} from "react";
import {
  Box,
  Alert,
  Typography,
  CircularProgress,
  Button,
  Divider,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import Markdown from "markdown-to-jsx";
import {useExtensionStyles} from "../../styles/extension.styles";
import {
  getDefaultPreferences,
  setWalletPreferences,
} from "../../lib/wallet/preferences";
import {
  useTranslationContext,
  Link,
  Modal,
} from "@unstoppabledomains/ui-components";
import {clearAllConnectedSites} from "../../lib/wallet/evm/connection";
import MainScreen from "../Legacy/MainScreen";
import usePreferences from "../../hooks/usePreferences";
import useConnections from "../../hooks/useConnections";
import {sendMessageToClient} from "../../lib/wallet/message";
import config from "../../config";
import {getManifestVersion} from "../../lib/runtime";

interface PreferencesProps {
  onClose: () => void;
}

export const Preferences: React.FC<PreferencesProps> = ({onClose}) => {
  const {classes, cx} = useExtensionStyles();
  const [t] = useTranslationContext();
  const {preferences, setPreferences} = usePreferences();
  const {connections, setConnections} = useConnections();
  const [compatModeSuccess, setCompatModeSuccess] = useState(false);

  const handleCompatibilityMode = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    // set the compatibility mode preference
    preferences.OverrideMetamask = event.target.checked;
    setPreferences({...preferences});
    await setWalletPreferences(preferences);

    // show a message to indicate pages must be reloaded for the new
    // setting to be applied
    if (event.target.checked) {
      setCompatModeSuccess(true);
    }
  };

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

  const handleMessaging = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    preferences.MessagingEnabled = event.target.checked;
    setPreferences({...preferences});
    await setWalletPreferences(preferences);
  };

  const handleDisconnectAll = async () => {
    // handle disconnect internally
    await clearAllConnectedSites();
    setConnections({});

    // send disconnect event to client
    await sendMessageToClient("disconnectRequest");
  };

  const handleRefreshParent = async () => {
    await sendMessageToClient("refreshRequest");
    setCompatModeSuccess(false);
  };

  return (
    <Box className={classes.container}>
      <Modal
        open={true}
        fullScreen={true}
        title={t("push.settings")}
        onClose={onClose}
      >
        <Box className={classes.preferenceContainer}>
          {!preferences ? (
            <Box
              className={cx(classes.walletContainer, classes.contentContainer)}
            >
              <CircularProgress className={classes.loadingSpinner} />
            </Box>
          ) : (
            <Box className={classes.contentContainer} mb={1} mt={-3}>
              <PreferenceSection
                title="Sherlock Assistant"
                description="Gain insight into apps by automatically detecting wallet addresses associated with onchain domains. Augments apps in this browser with rich identity details."
              >
                <FormControlLabel
                  label="Enable Sherlock Assistant"
                  control={
                    <Checkbox
                      checked={preferences.Scanning?.Enabled}
                      onChange={handleSherlockAssistant}
                    />
                  }
                />
              </PreferenceSection>
              <PreferenceSection
                title="Messaging"
                description="Chat securely with friends with Unstoppable Messaging, powered by XMTP and Push Protocol."
              >
                <FormControlLabel
                  label="Enable messaging"
                  control={
                    <Checkbox
                      checked={preferences.MessagingEnabled}
                      onChange={handleMessaging}
                    />
                  }
                />
              </PreferenceSection>
              <PreferenceSection
                title="Compatibility Mode"
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
                {compatModeSuccess && (
                  <Box className={classes.settingInfoContainer}>
                    <Alert severity="info" variant="filled">
                      <Typography variant="body2">
                        <Markdown>
                          Compatibility mode is now enabled, but **open tabs
                          must be refreshed** for compatibility mode to take
                          effect.
                        </Markdown>
                      </Typography>
                      <Box display="flex" justifyContent="right">
                        <Button
                          variant="text"
                          onClick={handleRefreshParent}
                          className={classes.actionButton}
                        >
                          Refresh now
                        </Button>
                      </Box>
                    </Alert>
                  </Box>
                )}
              </PreferenceSection>
              <PreferenceSection
                title="Wallet Connections"
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
              <PreferenceSection
                title="Version"
                description={`${getManifestVersion()} (${config.NODE_ENV})`}
              />
            </Box>
          )}
        </Box>
      </Modal>
    </Box>
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
