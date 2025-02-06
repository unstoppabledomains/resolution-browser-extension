import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Markdown from "markdown-to-jsx";
import React, {useEffect, useState} from "react";
import {titleCase} from "title-case";
import useAsyncEffect from "use-async-effect";

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
import {
  PermissionType,
  getManifestVersion,
  hasOptionalPermissions,
  removeOptionalPermissions,
  requestOptionalPermissions,
  setIcon,
} from "../../lib/runtime";
import {clearAllConnectedSites} from "../../lib/wallet/evm/connection";
import {sendMessageToClient} from "../../lib/wallet/message";
import {
  getDefaultPreferences,
  setWalletPreferences,
} from "../../lib/wallet/preferences";
import {prepareXmtpInBackground} from "../../lib/xmtp/state";
import {useExtensionStyles} from "../../styles/extension.styles";

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
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [isContextMenuEnabled, setIsContextMenuEnabled] = useState(false);
  const [isBrowsingEnabled, setIsBrowsingEnabled] = useState(false);
  const theme = useCustomTheme();

  useAsyncEffect(async () => {
    setAccount(await chromeStorageGet(StorageSyncKey.Account));
    setIsNotificationEnabled(
      await hasOptionalPermissions([PermissionType.Notifications]),
    );
    setIsContextMenuEnabled(
      await hasOptionalPermissions([
        PermissionType.ContextMenus,
        PermissionType.Tabs,
      ]),
    );
    setIsBrowsingEnabled(
      await hasOptionalPermissions([
        PermissionType.DeclarativeNetRequest,
        PermissionType.Tabs,
      ]),
    );
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

  const handleNotifications = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (event.target.checked) {
      if (await requestOptionalPermissions([PermissionType.Notifications])) {
        setIsNotificationEnabled(true);
      }
    } else {
      await removeOptionalPermissions([PermissionType.Notifications]);
      setIsNotificationEnabled(false);
    }
  };

  const handleContextMenu = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (event.target.checked) {
      if (
        await requestOptionalPermissions([
          PermissionType.ContextMenus,
          PermissionType.Tabs,
        ])
      ) {
        setIsContextMenuEnabled(true);
      }
    } else {
      await removeOptionalPermissions([PermissionType.ContextMenus]);
      setIsContextMenuEnabled(false);
    }
  };

  const handleDecentralizedBrowsing = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (event.target.checked) {
      if (
        await requestOptionalPermissions([
          PermissionType.DeclarativeNetRequest,
          PermissionType.Tabs,
        ])
      ) {
        setIsBrowsingEnabled(true);
      }
    } else {
      await removeOptionalPermissions([PermissionType.DeclarativeNetRequest]);
      setIsBrowsingEnabled(false);
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

  const renderStatus = (v: string) => {
    return (
      <Typography color={theme.palette.wallet.text.secondary} variant="caption">
        {v}
      </Typography>
    );
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
            <Box padding="1px" mb={1}>
              <Paper
                variant="elevation"
                sx={{
                  boxShadow: theme.shadows[2],
                  marginBottom: theme.spacing(4),
                }}
              >
                <Box display="flex" flexDirection="column" padding={2} mb={2}>
                  {" "}
                  <Typography variant="subtitle2" fontWeight="bold">
                    {t("common.account")}
                  </Typography>
                  <Typography variant="body2">{account}</Typography>
                </Box>
              </Paper>
              <Typography variant="h6" mb={1}>
                {t("common.options")}
              </Typography>
              <Box>
                <WalletPreference
                  title={t("extension.sherlockAssistant")}
                  description={t("extension.sherlockAssistantDescription")}
                  statusElement={renderStatus(
                    preferences?.Scanning?.Enabled
                      ? t("common.on")
                      : t("common.off"),
                  )}
                >
                  <FormControlLabel
                    label={`${t("manage.enable")} ${t("extension.sherlockAssistant")}`}
                    control={
                      <Checkbox
                        color={
                          theme.palette.mode === "light"
                            ? "primary"
                            : "secondary"
                        }
                        checked={preferences?.Scanning?.Enabled}
                        onChange={handleSherlockAssistant}
                      />
                    }
                  />
                </WalletPreference>
                <WalletPreference
                  title={t("push.messages")}
                  description={t("push.description")}
                  statusElement={renderStatus(
                    preferences?.MessagingEnabled
                      ? t("common.on")
                      : t("common.off"),
                  )}
                >
                  <FormControlLabel
                    label={`${t("manage.enable")} ${t("push.messages")}`}
                    control={
                      <Checkbox
                        color={
                          theme.palette.mode === "light"
                            ? "primary"
                            : "secondary"
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
                  statusElement={renderStatus(
                    isBrowsingEnabled ? t("common.on") : t("common.off"),
                  )}
                >
                  <FormControlLabel
                    label={`${t("manage.enable")} ${t("extension.decentralizedBrowsing")}`}
                    control={
                      <Checkbox
                        color={
                          theme.palette.mode === "light"
                            ? "primary"
                            : "secondary"
                        }
                        checked={isBrowsingEnabled}
                        onChange={handleDecentralizedBrowsing}
                      />
                    }
                  />
                </WalletPreference>
                <WalletPreference
                  title={t("extension.displayMode")}
                  description={t("extension.displayModeDescription")}
                  statusElement={renderStatus(titleCase(theme.palette.mode))}
                >
                  <LightDarkToggle />
                </WalletPreference>
                <WalletPreference
                  title={t("common.notifications")}
                  description={t("extension.notificationsDescription")}
                  statusElement={renderStatus(
                    isNotificationEnabled ? t("common.on") : t("common.off"),
                  )}
                >
                  <FormControlLabel
                    label={`${t("manage.enable")} ${t("common.notifications")}`}
                    control={
                      <Checkbox
                        color={
                          theme.palette.mode === "light"
                            ? "primary"
                            : "secondary"
                        }
                        checked={isNotificationEnabled}
                        onChange={handleNotifications}
                      />
                    }
                  />
                </WalletPreference>
                <WalletPreference
                  title={t("extension.rightClickMenu")}
                  description={t("extension.rightClickMenuDescription")}
                  statusElement={renderStatus(
                    isContextMenuEnabled ? t("common.on") : t("common.off"),
                  )}
                >
                  <FormControlLabel
                    label={`${t("manage.enable")} ${t("extension.rightClickMenu")}`}
                    control={
                      <Checkbox
                        color={
                          theme.palette.mode === "light"
                            ? "primary"
                            : "secondary"
                        }
                        checked={isContextMenuEnabled}
                        onChange={handleContextMenu}
                      />
                    }
                  />
                </WalletPreference>
              </Box>
              <Box mt={4}>
                <Typography variant="h6" mb={1}>
                  {t("common.advanced")}
                </Typography>
                <WalletPreference
                  title={t("extension.compatibilityMode")}
                  description={t("extension.compatibilityModeDescription")}
                  statusElement={renderStatus(
                    preferences?.OverrideMetamask
                      ? t("common.on")
                      : t("common.off"),
                  )}
                >
                  <FormControlLabel
                    label={`${t("manage.enable")} ${t("extension.compatibilityMode")}`}
                    control={
                      <Checkbox
                        color={
                          theme.palette.mode === "light"
                            ? "primary"
                            : "secondary"
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
                  statusElement={renderStatus(
                    connections && Object.keys(connections).length > 0
                      ? String(Object.keys(connections).length)
                      : t("common.none"),
                  )}
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
                          theme.palette.mode === "light"
                            ? "primary"
                            : "secondary"
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
                  title={t("extension.version")}
                  statusElement={renderStatus(
                    `${getManifestVersion()} (${config.NODE_ENV})`,
                  )}
                  description={`${getManifestVersion()} (${config.NODE_ENV})`}
                />
              </Box>
            </Box>
          )}
        </Box>
      </Modal>
    </Box>
  );
};
