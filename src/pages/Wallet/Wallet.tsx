import React, {useEffect, useState} from "react";
import {Box, Button, Paper, Typography} from "@mui/material";
import {
  DomainProfileTabType,
  DomainProfileKeys,
  Wallet,
  useFireblocksState,
  getAddressMetadata,
  getBootstrapState,
  isEthAddress,
  useTranslationContext,
} from "@unstoppabledomains/ui-components";
import config from "../../config";
import useIsMounted from "react-is-mounted-hook";
import {useExtensionStyles} from "../../styles/extension.styles";
import {AuthState, FIVE_MINUTES} from "../../types/wallet/auth";
import {Logger} from "../../lib/logger";
import {Preferences} from "./Preferences";
import {
  StorageSyncKey,
  chromeStorageClear,
  chromeStorageGet,
  chromeStorageRemove,
  chromeStorageSet,
} from "../../lib/chromeStorage";
import Header from "../../components/Header";
import {useSnackbar} from "notistack";
import usePreferences from "../../hooks/usePreferences";
import {
  getWalletPreferences,
  setWalletPreferences,
} from "../../lib/wallet/preferences";
import {sleep} from "../../lib/wallet/sleep";
import useConnections from "../../hooks/useConnections";
import {sendMessageToClient} from "../../lib/wallet/message";

const enum SnackbarKey {
  CTA = "cta",
  Success = "success",
}

const WalletComp: React.FC = () => {
  const isMounted = useIsMounted();
  const [walletState] = useFireblocksState();
  const {classes} = useExtensionStyles();
  const {enqueueSnackbar, closeSnackbar} = useSnackbar();
  const [t] = useTranslationContext();
  const {preferences, setPreferences, refreshPreferences} = usePreferences();
  const {isConnected, disconnect} = useConnections();
  const [authAddress, setAuthAddress] = useState<string>("");
  const [authDomain, setAuthDomain] = useState<string>("");
  const [authAvatar, setAuthAvatar] = useState<string>();
  const [authComplete, setAuthComplete] = useState(false);
  const [authState, setAuthState] = useState<AuthState>();
  const [authButton, setAuthButton] = useState<React.ReactNode>();
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [messagingEnabled, setMessagingEnabled] = useState(false);

  const handleAuthComplete = async () => {
    await chromeStorageRemove(StorageSyncKey.AuthState, "session");
    setAuthComplete(true);
  };

  const handleAuthStart = async (emailAddress: string, password: string) => {
    const authState: AuthState = {
      emailAddress,
      password,
      expiration: new Date().getTime() + FIVE_MINUTES,
    };
    await chromeStorageSet(
      StorageSyncKey.AuthState,
      JSON.stringify(authState),
      "session",
    );
  };

  // load the existing wallet if singed in
  useEffect(() => {
    if (!isMounted()) {
      return;
    }

    const loadWallet = async () => {
      try {
        // retrieve state of logged in wallet (if any)
        const signInState = getBootstrapState(walletState);
        if (!signInState) {
          // attempt to check for in-progress sign in state
          const inProgressAuthState = await chromeStorageGet(
            StorageSyncKey.AuthState,
            "session",
          );
          if (inProgressAuthState) {
            const now = new Date().getTime();
            const state: AuthState = JSON.parse(inProgressAuthState);
            if (state.expiration > 0 && now < state.expiration) {
              setAuthState(state);
              return;
            }
            await chromeStorageRemove(StorageSyncKey.AuthState, "session");
          }

          // set empty auth state
          setAuthState({emailAddress: "", password: ""});
          return;
        }

        // clear any previously in progress auth state
        setAuthState({emailAddress: "", password: ""});

        // query addresses belonging to accounts
        const accountEvmAddresses = [
          ...new Set(
            signInState.assets
              ?.map((a) => {
                return {
                  address: a.address,
                  networkId: a.blockchainAsset.blockchain.networkId,
                };
              })
              .filter((a) => isEthAddress(a.address)),
          ),
        ];

        // ensure an EVM address is available
        if (accountEvmAddresses.length === 0) {
          return;
        }
        setAuthAddress(accountEvmAddresses[0].address);
        localStorage.setItem(
          DomainProfileKeys.AuthAddress,
          accountEvmAddresses[0].address,
        );

        // resolve the domain of this address (if available)
        const resolution = await getAddressMetadata(
          accountEvmAddresses[0].address,
        );
        if (resolution?.name) {
          setAuthDomain(resolution.name);
          localStorage.setItem(
            DomainProfileKeys.AuthDomain,
            resolution.name.toLowerCase(),
          );
          if (resolution?.imageType !== "default") {
            setAuthAvatar(resolution.avatarUrl);
          }
        }
      } catch (e) {
        Logger.error(e, "Popup", "error loading wallet in extension popup");
      } finally {
        setIsLoaded(true);
      }
    };
    void loadWallet();
  }, [isMounted, authComplete]);

  // prompt for compatibility mode once settings are loaded
  useEffect(() => {
    if (!preferences || !authComplete) {
      return;
    }

    // update messaging status
    setMessagingEnabled(preferences.MessagingEnabled);

    // take appropriate action on compatibility mode settings
    void handleCompatibilitySettings();
  }, [preferences, authComplete]);

  // handleCompatibilitySettings determines whether to automatically apply the
  // compatibility mode, or ask the user in a CTA
  const handleCompatibilitySettings = async () => {
    // check whether setting is already applied
    if (preferences?.OverrideMetamask) {
      return;
    }

    // ask the user about compatibility mode if there is already another
    // wallet extension installed on this browser
    if (window.ethereum || config.ALWAYS_PROMPT_COMPATIBILITY_MODE === "true") {
      // check whether CTA has already been shown
      const hasAlreadyShownCta = await chromeStorageGet(
        StorageSyncKey.CompatibilityModeCta,
        "local",
      );
      if (hasAlreadyShownCta) {
        return;
      }

      // wait a few moments before showing the CTA so the has a chance to show base
      // wallet elements and not overwhelm the user
      await sleep(2000);

      // show the CTA
      enqueueSnackbar(
        <Typography variant="body2">
          Enable compatibility mode? This extension can override other wallets
          like MetaMask for enhanced functionality. You can update your
          preference from the settings menu.
        </Typography>,
        {
          variant: "info",
          key: SnackbarKey.CTA,
          action: (
            <Box display="flex" width="100%">
              <Button
                variant="text"
                size="small"
                color="primary"
                className={classes.actionButton}
                onClick={() => closeSnackbar(SnackbarKey.CTA)}
              >
                Not now
              </Button>
              <Button
                variant="text"
                size="small"
                color="primary"
                className={classes.actionButton}
                onClick={handleEnableCompatibilityMode}
              >
                {t("manage.enable")}
              </Button>
            </Box>
          ),
        },
      );

      // remember that the CTA has been shown
      await chromeStorageSet(
        StorageSyncKey.CompatibilityModeCta,
        "true",
        "local",
      );
    } else {
      // automatically enable if there are no other wallet extension
      // installed on this browser
      await handleEnableCompatibilityMode();
    }
  };

  const handleEnableCompatibilityMode = async () => {
    // set the compatibility mode preference
    preferences.OverrideMetamask = true;
    setPreferences({...preferences});
    await setWalletPreferences(preferences);

    // close existing snackbar and wait a moment
    closeSnackbar(SnackbarKey.CTA);
    await sleep(500);

    // notify user of successful enablement
    enqueueSnackbar(
      <Typography variant="body2">
        Compatibility mode is enabled, but will not take effect on open tabs
        until you refresh the page.
      </Typography>,
      {
        key: SnackbarKey.Success,
        variant: "warning",
        action: (
          <Box display="flex" width="100%">
            <Button
              variant="text"
              size="small"
              color="primary"
              className={classes.actionButton}
              onClick={handleRefreshParent}
            >
              Refresh now
            </Button>
          </Box>
        ),
      },
    );
  };

  const handleRefreshParent = async () => {
    closeSnackbar(SnackbarKey.Success);
    await sendMessageToClient("refreshRequest");
  };

  const handleDisconnect = async () => {
    // disconnect internally
    await disconnect();

    // notify the client of disconnection
    await sendMessageToClient("disconnectRequest");
  };

  const handleLogout = async () => {
    // clear extension storage
    await chromeStorageClear("local");
    await chromeStorageClear("session");
    await chromeStorageClear("sync");

    // reset identity variable state
    setAuthAddress(undefined);
    setAuthDomain(undefined);
    setAuthAvatar(undefined);

    // set basic wallet enablement preferences, since we can assume
    // next time the extension loads that the user enabled the wallet
    // features, and already has an existing wallet.
    const defaultPreferences = await getWalletPreferences();
    defaultPreferences.WalletEnabled = true;
    defaultPreferences.HasExistingWallet = true;
    defaultPreferences.DefaultView = "wallet";
    await setWalletPreferences(defaultPreferences);

    // close the extension window
    window.close();
  };

  const handleShowPreferences = () => {
    setShowSettings(true);
  };

  const handleClosePreferences = async () => {
    await refreshPreferences();
    setShowSettings(false);
  };

  return showSettings ? (
    <Preferences onClose={handleClosePreferences} />
  ) : (
    <Paper className={classes.container}>
      {!authAddress && (
        <Header
          title="Unstoppable Lite Wallet"
          subTitle="A web3 wallet for domainers and their domains"
          iconPath="icon/wallet.svg"
        />
      )}
      <Box
        className={classes.walletContainer}
        sx={{
          display: isLoaded ? "flex" : "none",
        }}
      >
        {authState && preferences && (
          <Wallet
            mode={authAddress ? "portfolio" : "basic"}
            address={authAddress}
            domain={authDomain}
            emailAddress={authState.emailAddress}
            recoveryPhrase={authState.password}
            avatarUrl={authAvatar}
            showMessages={messagingEnabled}
            isNewUser={!preferences.HasExistingWallet}
            disableInlineEducation={true}
            disableBasicHeader={true}
            fullScreenModals={true}
            forceRememberOnDevice={true}
            onLoginInitiated={handleAuthStart}
            onLogout={handleLogout}
            onDisconnect={isConnected ? handleDisconnect : undefined}
            onSettingsClick={handleShowPreferences}
            onUpdate={(_t: DomainProfileTabType) => {
              handleAuthComplete();
            }}
            setButtonComponent={setAuthButton}
            setAuthAddress={setAuthAddress}
          />
        )}
        {!authAddress && (
          <Box display="flex" flexDirection="column" width="100%">
            {authButton}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default WalletComp;
