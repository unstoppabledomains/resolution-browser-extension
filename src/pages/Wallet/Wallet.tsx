import React, {useEffect, useState} from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import {
  DomainProfileTabType,
  DomainProfileKeys,
  Wallet,
  useFireblocksState,
  getAddressMetadata,
  getBootstrapState,
  isEthAddress,
  useTranslationContext,
  useUnstoppableMessaging,
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
import {useNavigate} from "react-router-dom";
import {ResponseType, getResponseType} from "../../types/wallet/provider";
import {getProviderRequest, getXmtpChatAddress} from "../../lib/wallet/request";
import {AppEnv} from "@unstoppabledomains/config";
import {SignInCta} from "./SignInCta";
import {initializeBrowserSettings} from "../../lib/resolver/settings";
import {
  createNotification,
  focusAllPopups,
  getAllPopups,
  setBadgeCount,
  setIcon,
} from "../../lib/runtime";
import {notifyXmtpServiceWorker} from "../../lib/xmtp/state";

const enum SnackbarKey {
  CTA = "cta",
  Success = "success",
}

const WalletComp: React.FC = () => {
  const isMounted = useIsMounted();
  const navigate = useNavigate();
  const [walletState] = useFireblocksState();
  const {classes} = useExtensionStyles();
  const {enqueueSnackbar, closeSnackbar} = useSnackbar();
  const [t] = useTranslationContext();
  const {preferences, setPreferences, refreshPreferences} = usePreferences();
  const {setOpenChat, isChatReady} = useUnstoppableMessaging();
  const {isConnected, disconnect} = useConnections();
  const [isNewUser, setIsNewUser] = useState<boolean>();
  const [authAddress, setAuthAddress] = useState<string>("");
  const [authDomain, setAuthDomain] = useState<string>("");
  const [authAvatar, setAuthAvatar] = useState<string>();
  const [authComplete, setAuthComplete] = useState(false);
  const [authState, setAuthState] = useState<AuthState>();
  const [authButton, setAuthButton] = useState<React.ReactNode>();
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSignInCta, setShowSignInCta] = useState(false);
  const [messagingEnabled, setMessagingEnabled] = useState(false);

  // method to remove the window close listener, used to catch the situation
  // where user closes the window. If the window is closed by expected means,
  // this method is used to cancel the listener so the handler doesn't fire.
  let removeBeforeUnloadListener: () => void;

  // load the existing wallet if singed in
  useEffect(() => {
    if (!isMounted()) {
      return;
    }

    // add a listener for unload, which will detect if a user manually closes
    // the window before handling the connection request, only if this login
    // request is associated with a wallet connect request.
    const providerRequest = getProviderRequest();
    if (providerRequest) {
      const beforeUnloadHandler = handleUnexpectedClose(providerRequest);
      window.addEventListener("beforeunload", beforeUnloadHandler);
      removeBeforeUnloadListener = () =>
        window.removeEventListener("beforeunload", beforeUnloadHandler);
    }

    const loadWallet = async () => {
      try {
        // retrieve state of logged in wallet (if any)
        const signInState = getBootstrapState(walletState);
        if (!signInState) {
          // show the sign in CTA unless a provider request is present that indicates
          // an sign in has already been initiated by the user
          const providerRequest = getProviderRequest();
          if (providerRequest?.type === "signInRequest") {
            // set new user status for the sign in request
            setIsNewUser(providerRequest.params[0]);
          } else if (!providerRequest) {
            // show sign in CTA since no provider request
            setShowSignInCta(true);

            // check whether there are popups that need focus
            await handleFocusPopups();
            return;
          }

          // attempt to check for in-progress sign in state
          const inProgressAuthState = await chromeStorageGet<string>(
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

        // check whether there are popups that need focus
        if (await handleFocusPopups()) {
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
    setIsNewUser(!preferences.HasExistingWallet);

    // take appropriate action on compatibility mode settings
    void handleCompatibilitySettings();
  }, [preferences, authComplete]);

  useEffect(() => {
    if (!authAddress || !isChatReady) {
      return;
    }

    // check for an XMTP conversation ID
    const xmtpChatAddress = getXmtpChatAddress();
    if (xmtpChatAddress) {
      setOpenChat(xmtpChatAddress);
      return;
    }

    // wait for XMTP to be ready and notify the service worker
    void notifyXmtpServiceWorker(authAddress);
  }, [authAddress, isChatReady]);

  const handleAuthComplete = async () => {
    // remember the user email address
    if (authState.emailAddress) {
      await chromeStorageSet(StorageSyncKey.Account, authState.emailAddress);
    }

    // cleanup state from authentication attempt
    await chromeStorageRemove(StorageSyncKey.AuthState, "session");

    // if the sign in was initiated by a wallet connection, route the processing
    // back to the connect page now that sign in is completed
    const providerRequest = getProviderRequest();
    if (providerRequest) {
      if (providerRequest.type === "signInRequest") {
        await Promise.all([
          // clear badge count
          setBadgeCount(0),

          // create a notification to indicate sign in was successful
          createNotification(
            `signIn${Date.now()}`,
            t("wallet.title"),
            t("wallet.readyToUse"),
            undefined,
            2,
          ),

          // short delay to ensure notification processes
          sleep(500),
        ]);

        // close the window after successful login
        handleClose();
        return;
      }
      navigate("/connect");
    }

    // set the complete flag
    setAuthComplete(true);
  };

  const handleAuthStart = async (emailAddress: string, password: string) => {
    const authState: AuthState = {
      emailAddress,
      password,
      expiration: new Date().getTime() + FIVE_MINUTES,
    };
    setAuthState(authState);
    await chromeStorageSet(
      StorageSyncKey.AuthState,
      JSON.stringify(authState),
      "session",
    );
  };

  const handleLogout = async () => {
    // clear extension storage
    await chromeStorageClear("local");
    await chromeStorageClear("session");
    await chromeStorageClear("sync");

    // switch back to sign in CTA view
    setShowSignInCta(true);

    // reset identity variable state
    setAuthAddress(undefined);
    setAuthDomain(undefined);
    setAuthAvatar(undefined);
    setAuthState(undefined);

    // set basic wallet enablement preferences, since we can assume
    // next time the extension loads that the user enabled the wallet
    // features, and already has an existing wallet.
    const defaultPreferences = await getWalletPreferences();
    defaultPreferences.WalletEnabled = true;
    defaultPreferences.HasExistingWallet = true;
    defaultPreferences.DefaultView = "wallet";
    await setWalletPreferences(defaultPreferences);

    // initialize browser settings
    await initializeBrowserSettings();

    // set default icon
    await setIcon("default");

    // close the extension window
    handleClose();
  };

  const handleUnexpectedClose = (m: any) => (_e: BeforeUnloadEvent) => {
    // called when the user manually closes the connection window, without
    // interacting with any of the buttons
    if (m) {
      handleError(getResponseType(m.type), new Error("user closed wallet"));
    }
    return;
  };

  const handleFocusPopups = async () => {
    const allPopups = getAllPopups();
    await setBadgeCount(allPopups.length);
    if (allPopups.length > 0) {
      await focusAllPopups();
      handleClose();
      return true;
    }
    return false;
  };

  const handleError = (type: ResponseType, e: Error) => {
    // handle provider error and cancel the operation
    Logger.error(e, "Popup", "handled provider error", type);
    chrome.runtime.sendMessage({
      type,
      error: String(e),
    });
    handleClose();
  };

  const handleClose = () => {
    // remove the window unload listener, since this is an expected
    // call by the user to close the window
    if (removeBeforeUnloadListener) {
      removeBeforeUnloadListener();
    }
    window.close();
  };

  // handleCompatibilitySettings determines whether to automatically apply the
  // compatibility mode, or ask the user in a CTA
  const handleCompatibilitySettings = async () => {
    // check whether setting is already applied
    if (preferences?.OverrideMetamask) {
      return;
    }

    // check whether this is a wallet connect request, as the snackbar notification
    // is very distracting to an operation
    if (getProviderRequest()) {
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
          {t("extension.compatibilityModeCta")}
        </Typography>,
        {
          variant: "info",
          key: SnackbarKey.CTA,
          persist: true,
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
        {t("extension.compatibilityModeEnabled")}
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
              {t("extension.refreshNow")}
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

    // set default icon
    await setIcon("default");

    // notify the client of disconnection
    await sendMessageToClient("disconnectRequest");
  };

  const handleShowPreferences = () => {
    setShowSettings(true);
  };

  const handleClosePreferences = async () => {
    await refreshPreferences();
    setShowSettings(false);
  };

  return showSignInCta ? (
    <SignInCta />
  ) : showSettings ? (
    <Preferences onClose={handleClosePreferences} />
  ) : (
    <Paper className={classes.container}>
      {!authAddress && (
        <Header
          title={t("wallet.title")}
          subTitle={t("manage.cryptoWalletDescriptionShort")}
        />
      )}
      {(config.NODE_ENV as AppEnv) !== "production" && (
        <Box
          className={
            authAddress
              ? classes.testNetContainerLeft
              : classes.testNetContainerRight
          }
        >
          <Chip
            variant="filled"
            label={config.NODE_ENV}
            color="warning"
            size="small"
          />
        </Box>
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
            isNewUser={isNewUser}
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
