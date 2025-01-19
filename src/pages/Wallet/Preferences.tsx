import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import Markdown from "markdown-to-jsx";
import React, {useEffect, useState} from "react";

import {
  DomainProfileKeys,
  LightDarkToggle,
  Link,
  Modal,
  localStorageWrapper,
  useCustomTheme,
  useFireblocksAccessToken,
  useTranslationContext,
} from "@unstoppabledomains/ui-components";
import {WalletPreference} from "@unstoppabledomains/ui-components/components/Wallet/WalletPreference";

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

interface PreferencesProps {
  onClose: () => void;
}

export const Preferences: React.FC<PreferencesProps> = ({onClose}) => {
  const {classes, cx} = useExtensionStyles();
  const [t] = useTranslationContext();
  const getAccessToken = useFireblocksAccessToken();
  const {preferences, setPreferences} = usePreferences();
  const {connections, setConnections} = useConnections();
  const [compatModeSuccess, setCompatModeSuccess] = useState(false);
  const [account, setAccount] = useState<string>();
  const theme = useCustomTheme();

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
              <WalletPreference
                title={t("extension.sherlockAssistant")}
                description={t("extension.sherlockAssistantDescription")}
              >
                <FormControlLabel
                  label={`${t("manage.enable")} ${t("extension.sherlockAssistant")}`}
                  control={
                    <Checkbox
                      color={
                        theme.palette.mode === "light" ? "primary" : "secondary"
                      }
                      checked={preferences?.Scanning?.Enabled}
                      onChange={handleSherlockAssistant}
                    />
                  }
                />
              </WalletPreference>
              <WalletPreference
                title={t("extension.compatibilityMode")}
                description={t("extension.compatibilityModeDescription")}
              >
                <FormControlLabel
                  label={`${t("manage.enable")} ${t("extension.compatibilityMode")}`}
                  control={
                    <Checkbox
                      color={
                        theme.palette.mode === "light" ? "primary" : "secondary"
                      }
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
                          color={
                            theme.palette.mode === "light"
                              ? "primary"
                              : "secondary"
                          }
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
              </WalletPreference>
              <WalletPreference
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
                      <Link
                        className={classes.link}
                        href={`https://${site}`}
                        target="_blank"
                      >
                        <Typography variant="caption">{site}</Typography>
                      </Link>
                    ))}
                {connections && Object.keys(connections).length > 0 && (
                  <Box display="flex" width="100%" mt={1} mb={2}>
                    <Button
                      color={
                        theme.palette.mode === "light" ? "primary" : "secondary"
                      }
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
              </WalletPreference>
              <WalletPreference
                title={t("extension.displayMode")}
                description={t("extension.displayModeDescription")}
              >
                <LightDarkToggle />
              </WalletPreference>
              <WalletPreference
                title={t("push.messages")}
                description={t("push.description")}
              >
                <FormControlLabel
                  label={`${t("manage.enable")} ${t("push.messages")}`}
                  control={
                    <Checkbox
                      color={
                        theme.palette.mode === "light" ? "primary" : "secondary"
                      }
                      checked={preferences?.MessagingEnabled}
                      onChange={handleMessaging}
                    />
                  }
                />
              </WalletPreference>
              <WalletPreference
                title={t("extension.decentralizedBrowsing")}
                description={t("extension.decentralizedBrowsingDescription")}
              >
                <Box display="flex" width="100%" mt={1}>
                  <MainScreen hideUserId />
                </Box>
              </WalletPreference>
              {account && (
                <WalletPreference
                  title={t("common.account")}
                  description={account}
                />
              )}
              <WalletPreference
                title={t("extension.version")}
                description={`${getManifestVersion()} (${config.NODE_ENV})`}
              />
            </Box>
          )}
        </Box>
      </Modal>
    </Box>
  );
};
