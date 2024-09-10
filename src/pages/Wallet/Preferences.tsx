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
import {setWalletPreferences} from "../../lib/wallet/preferences";
import {
  useTranslationContext,
  Link,
  Modal,
  notifyEvent,
} from "@unstoppabledomains/ui-components";
import {ConnectedSites} from "../../types/wallet/connection";
import {
  clearAllConnectedSites,
  getConnectedSites,
} from "../../lib/wallet/evm/connection";
import MainScreen from "../Legacy/MainScreen";
import usePreferences from "../../hooks/usePreferences";

interface PreferencesProps {
  onClose: () => void;
}

export const Preferences: React.FC<PreferencesProps> = ({onClose}) => {
  const {classes, cx} = useExtensionStyles();
  const [t] = useTranslationContext();
  const {preferences, setPreferences} = usePreferences();
  const [connections, setConnections] = useState<ConnectedSites>();
  const [compatModeSuccess, setCompatModeSuccess] = useState(false);

  // load site connections
  useEffect(() => {
    const loadConnections = async () => {
      try {
        setConnections(await getConnectedSites());
      } catch (e) {
        notifyEvent(e, "warning", "Wallet", "Configuration", {
          msg: "error loading connections",
        });
      }
    };
    void loadConnections();
  }, []);

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

  const handleDisconnectAll = async () => {
    await clearAllConnectedSites();
    setConnections({});
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
                {compatModeSuccess && (
                  <Box className={classes.settingInfoContainer}>
                    <Alert severity="info" variant="filled">
                      <Typography variant="body2">
                        <Markdown>
                          Compatibility mode is now enabled. **Open tabs must be
                          refreshed** for compatibility mode to take effect.
                        </Markdown>
                      </Typography>
                    </Alert>
                  </Box>
                )}
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
