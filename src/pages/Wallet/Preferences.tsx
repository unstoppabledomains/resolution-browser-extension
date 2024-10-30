import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import {useFlags} from "launchdarkly-react-client-sdk";
import Markdown from "markdown-to-jsx";
import React, {useEffect, useState} from "react";

import {
  DomainProfileKeys,
  Link,
  Modal,
  localStorageWrapper,
  useFireblocksAccessToken,
  useTranslationContext,
} from "@unstoppabledomains/ui-components";

import config from "../../config";
import useConnections from "../../hooks/useConnections";
import usePreferences from "../../hooks/usePreferences";
import {StorageSyncKey, chromeStorageGet} from "../../lib/chromeStorage";
import {getManifestVersion, setIcon} from "../../lib/runtime";
import {clearAllConnectedSites} from "../../lib/wallet/evm/connection";
import {sendMessageToClient} from "../../lib/wallet/message";
import {
  getDefaultPreferences,
  setWalletPreferences,
} from "../../lib/wallet/preferences";
import {prepareXmtpInBackground} from "../../lib/xmtp/state";
import {useExtensionStyles} from "../../styles/extension.styles";
import MainScreen from "../Legacy/MainScreen";
import {TwoFactorModal} from "./TwoFactorModal";

interface PreferencesProps {
  onClose: () => void;
}

export const Preferences: React.FC<PreferencesProps> = ({onClose}) => {
  const {classes, cx} = useExtensionStyles();
  const [t] = useTranslationContext();
  const flags = useFlags();
  const getAccessToken = useFireblocksAccessToken();
  const {preferences, setPreferences} = usePreferences();
  const {connections, setConnections} = useConnections();
  const [compatModeSuccess, setCompatModeSuccess] = useState(false);
  const [account, setAccount] = useState<string>();
  const [isTwoFactorOpen, setIsTwoFactorOpen] = useState(false);

  useEffect(() => {
    const loadAccount = async () => {
      setAccount(await chromeStorageGet(StorageSyncKey.Account));
    };
    void loadAccount();
  }, []);

  const handleCompatibilityMode = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!preferences) {
      return;
    }

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

  const handleTwoFactorClicked = () => {
    if (!preferences) {
      return;
    }

    // initialize scanning preferences if required
    if (!preferences.TwoFactorAuth) {
      const defaultPreferences = getDefaultPreferences();
      preferences.TwoFactorAuth = defaultPreferences.TwoFactorAuth;
    }

    // open the two-factor modal
    setIsTwoFactorOpen(true);
  };

  const handleTwoFactorClose = () => {
    setIsTwoFactorOpen(false);
  };

  const handleMessaging = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!preferences) {
      return;
    }

    // store messaging preference
    preferences.MessagingEnabled = event.target.checked;
    setPreferences({...preferences});
    await setWalletPreferences(preferences);

    // sign the user in if enabling
    if (preferences.MessagingEnabled) {
      const address = await localStorageWrapper.getItem(
        DomainProfileKeys.AuthAddress,
      );
      if (address) {
        const accessToken = await getAccessToken();
        await prepareXmtpInBackground(accessToken, address);
      }
    }
  };

  const handleDisconnectAll = async () => {
    // handle disconnect internally
    await clearAllConnectedSites();
    setConnections({});

    // remove the connected icon
    await setIcon("default");

    // send disconnect event to client
    await sendMessageToClient("disconnectRequest");
  };

  const handleRefreshParent = async () => {
    await sendMessageToClient("refreshRequest");
    setCompatModeSuccess(false);
  };

  return (
    <Box className={classes.container}>
      <Modal open fullScreen title={t("push.settings")} onClose={onClose}>
        <Box className={classes.preferenceContainer}>
          {!preferences ? (
            <Box
              className={cx(classes.walletContainer, classes.contentContainer)}
            >
              <CircularProgress className={classes.loadingSpinner} />
            </Box>
          ) : (
            <Box className={classes.contentContainer} mb={1} mt={-3}>
              {flags.extensionEnableTotp && (
                <PreferenceSection
                  title="Two-Factor Authentication"
                  description="Two-factor authentication (2FA) is highly recommended to ensure your wallet is secure. Use any authenticator app, such as Google Authenticator."
                >
                  <Button
                    className={classes.button}
                    onClick={handleTwoFactorClicked}
                    variant={
                      preferences?.TwoFactorAuth?.Enabled
                        ? "outlined"
                        : "contained"
                    }
                  >
                    {preferences?.TwoFactorAuth?.Enabled
                      ? "Disable 2FA"
                      : "Enable 2FA"}
                  </Button>
                </PreferenceSection>
              )}
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
              <PreferenceSection
                title={t("extension.compatibilityMode")}
                description={t("extension.compatibilityModeDescription")}
              >
                <FormControlLabel
                  label={`${t("manage.enable")} ${t("extension.compatibilityMode")}`}
                  control={
                    <Checkbox
                      checked={preferences?.OverrideMetamask}
                      onChange={handleCompatibilityMode}
                    />
                  }
                />
                {compatModeSuccess && (
                  <Box className={classes.settingInfoContainer}>
                    <Alert severity="info" variant="filled">
                      <Typography variant="body2">
                        <Markdown>
                          {t("extension.compatibilityModeEnabled")}
                        </Markdown>
                      </Typography>
                      <Box display="flex" justifyContent="right">
                        <Button
                          variant="text"
                          onClick={handleRefreshParent}
                          className={classes.actionButton}
                        >
                          {t("extension.refreshNow")}
                        </Button>
                      </Box>
                    </Alert>
                  </Box>
                )}
              </PreferenceSection>
              <PreferenceSection
                title={t("extension.walletConnections")}
                description={
                  connections && Object.keys(connections).length > 0
                    ? t("extension.walletConnectionsDescription")
                    : t("extension.noWalletConnections")
                }
              >
                {connections &&
                  Object.keys(connections)
                    .sort((a, b) => a.localeCompare(b))
                    .map(site => (
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
                      {t("header.disconnectAll")}
                    </Button>
                  </Box>
                )}
              </PreferenceSection>
              <PreferenceSection
                title={t("push.messages")}
                description={t("push.description")}
              >
                <FormControlLabel
                  label={`${t("manage.enable")} ${t("push.messages")}`}
                  control={
                    <Checkbox
                      checked={preferences?.MessagingEnabled}
                      onChange={handleMessaging}
                    />
                  }
                />
              </PreferenceSection>
              <PreferenceSection
                title={t("extension.decentralizedBrowsing")}
                description={t("extension.decentralizedBrowsingDescription")}
              >
                <Box display="flex" width="100%" mt={1}>
                  <MainScreen hideUserId />
                </Box>
              </PreferenceSection>
              {account && (
                <PreferenceSection
                  title={t("common.account")}
                  description={account}
                />
              )}
              <PreferenceSection
                title={t("extension.version")}
                description={`${getManifestVersion()} (${config.NODE_ENV})`}
              />
            </Box>
          )}
        </Box>
      </Modal>
      {isTwoFactorOpen && preferences && (
        <TwoFactorModal
          open={isTwoFactorOpen}
          onClose={handleTwoFactorClose}
          preferences={preferences}
          setPreferences={setPreferences}
        />
      )}
    </Box>
  );
};

interface PreferenceSectionProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

export const PreferenceSection: React.FC<PreferenceSectionProps> = ({
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
