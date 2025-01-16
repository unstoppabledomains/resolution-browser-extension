import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import {useSnackbar} from "notistack";
import queryString from "query-string";
import React, {useEffect, useState} from "react";
import useIsMounted from "react-is-mounted-hook";
import {useNavigate} from "react-router-dom";

import {AppEnv} from "@unstoppabledomains/config";
import {
  CustodyState,
  DomainProfileKeys,
  DomainProfileTabType,
  Wallet,
  getAddressMetadata,
  getBootstrapState,
  isEthAddress,
  localStorageWrapper,
  useCustomTheme,
  useFireblocksAccessToken,
  useFireblocksState,
  useTranslationContext,
  useUnstoppableMessaging,
} from "@unstoppabledomains/ui-components";
import {TokenRefreshResponse} from "@unstoppabledomains/ui-components/lib/types/fireBlocks";

import Header from "../../components/Header";
import config from "../../config";
import useConnections from "../../hooks/useConnections";
import usePreferences from "../../hooks/usePreferences";
import {
  StorageSyncKey,
  chromeStorageClear,
  chromeStorageGet,
  chromeStorageRemove,
  chromeStorageSet,
} from "../../lib/chromeStorage";
import {Logger} from "../../lib/logger";
import {initializeBrowserSettings} from "../../lib/resolver/settings";
import {
  BadgeColor,
  createNotification,
  focusExtensionWindows,
  getBadgeCount,
  hasOptionalPermissions,
  openSidePanel,
  setBadgeCount,
  setIcon,
} from "../../lib/runtime";
import {sendMessageToClient} from "../../lib/wallet/message";
import {
  getWalletPreferences,
  setWalletPreferences,
} from "../../lib/wallet/preferences";
import {getProviderRequest, getXmtpChatAddress} from "../../lib/wallet/request";
import {sleep} from "../../lib/wallet/sleep";
import {
  notifyXmtpServiceWorker,
  prepareXmtpInBackground,
} from "../../lib/xmtp/state";
import {useExtensionStyles} from "../../styles/extension.styles";
import {AuthState, FIVE_MINUTES} from "../../types/wallet/auth";
import {ResponseType, getResponseType} from "../../types/wallet/provider";
import {PermissionCta} from "./PermissionCta";
import {Preferences} from "./Preferences";
import {SignInCta} from "./SignInCta";

const enum SnackbarKey {
  CTA = "cta",
  Success = "success",
  UnreadMessage = "unreadMessage",
}

const WalletComp: React.FC = () => {
  const isMounted = useIsMounted();
  const navigate = useNavigate();
  const theme = useCustomTheme();
  const [walletState] = useFireblocksState();
  const getAccessToken = useFireblocksAccessToken();
  const {classes} = useExtensionStyles();
  const {enqueueSnackbar, closeSnackbar} = useSnackbar();
  const [t] = useTranslationContext();
  const {preferences, setPreferences, refreshPreferences} = usePreferences();
  const {isChatReady, setIsChatReady, setOpenChat, setIsChatOpen} =
    useUnstoppableMessaging();
  const {isConnected, disconnect} = useConnections();
  const [isNewUser, setIsNewUser] = useState<boolean>();
  const [loginClicked, setLoginClicked] = useState<boolean>();
  const [authAddress, setAuthAddress] = useState<string>("");
  const [authDomain, setAuthDomain] = useState<string>("");
  const [authAvatar, setAuthAvatar] = useState<string>();
  const [authComplete, setAuthComplete] = useState(false);
  const [authState, setAuthState] = useState<AuthState>();
  const [authButton, setAuthButton] = useState<React.ReactNode>();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isBasicDisabled, setIsBasicDisabled] = useState(false);
  const [showPermissionCta, setShowPermissionCta] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSignInCta, setShowSignInCta] = useState(false);
  const [messagingEnabled, setMessagingEnabled] = useState(false);

  // indicates that the display mode is basic (or portfolio)
  const showFooter = !authAddress || !authComplete;
  const isBasicMode = showFooter && !loginClicked && !isBasicDisabled;

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
        // check required permissions for wallet features
        const isGranted = await hasOptionalPermissions();
        setIsPermissionGranted(isGranted);

        // retrieve state of logged in wallet (if any)
        const signInState = getBootstrapState(walletState);
        if (!signInState) {
          // check for and validate in progress sign in auth state
          let inProgressAuthState = await chromeStorageGet<string>(
            StorageSyncKey.AuthState,
            "session",
          );
          if (inProgressAuthState) {
            const now = new Date().getTime();
            const state: AuthState = JSON.parse(inProgressAuthState);
            if (
              state.expiration &&
              state.expiration > 0 &&
              now < state.expiration
            ) {
              // set local auth state
              setAuthState(state);
            } else {
              // clear expired auth state
              await chromeStorageRemove(StorageSyncKey.AuthState, "session");
              inProgressAuthState = "";
            }
          }

          // check fireblocks state in chrome storage, and wait for a value to
          // be present if it is found to prevent sign in CTA flicker.
          const fireblocksState = await chromeStorageGet<string>(
            StorageSyncKey.FireblocksState,
            "local",
          );
          if (
            !inProgressAuthState &&
            fireblocksState &&
            Object.keys(JSON.parse(fireblocksState)).length > 0
          ) {
            return;
          }

          // show the sign in CTA unless a provider request is present that indicates
          // an sign in has already been initiated by the user
          if (inProgressAuthState) {
            // continue an in progress authentication UX if the state has been
            // retrieved from the session.
            setIsNewUser(false);
            return;
          } else if (providerRequest?.type === "signInRequest") {
            // set new user status for the sign in request
            setIsNewUser(providerRequest.params[0]);
          } else if (!providerRequest) {
            // show sign in CTA since no provider request is detected and there
            // is not an in progress authentication.
            setShowSignInCta(true);

            // check whether there are popups that need focus
            await handleFocusPopups();
            return;
          }

          // set empty auth state
          setAuthState({emailAddress: "", password: ""});
          return;
        }

        // if there is a claim in progress return at this point
        if (signInState.custodyState.state === CustodyState.CLAIMING) {
          return;
        }

        // if there is a provider request at this point return
        if (providerRequest?.type !== "signInRequest") {
          if (providerRequest) {
            return;
          }

          // check whether there are popups that need focus
          if (await handleFocusPopups()) {
            return;
          }
        }

        // ensure we don't show basic mode to prevent flicker
        setIsBasicDisabled(true);

        // clear auth state if necessary
        if (authState?.emailAddress) {
          setAuthState({emailAddress: "", password: ""});
        }

        // set auth address if necessary
        if (!authAddress) {
          // query addresses belonging to accounts
          const accountEvmAddresses = [
            ...new Set(
              signInState.assets
                ?.map(a => {
                  return {
                    address: a.address,
                    networkId: a.blockchainAsset.blockchain.networkId,
                  };
                })
                .filter(a => isEthAddress(a.address)),
            ),
          ];

          // ensure an EVM address is available
          if (accountEvmAddresses.length === 0) {
            return;
          }
          setAuthAddress(accountEvmAddresses[0].address);
          await localStorageWrapper.setItem(
            DomainProfileKeys.AuthAddress,
            accountEvmAddresses[0].address,
          );
        }

        // clear the sign in CTA if necessary
        if (showSignInCta) {
          setShowSignInCta(false);
        }
      } catch (e: any) {
        Logger.error(e, "Popup", "error loading wallet in extension popup");
        await handleLogout(false);
      } finally {
        setIsLoaded(true);
      }
    };
    void loadWallet();
  }, [isMounted, authComplete, walletState]);

  // prompt for permissions once the user has take custody of the wallet. When
  // in custody mode we do not need additional permission.
  useEffect(() => {
    // skip if the CTA is already shown
    if (showPermissionCta) {
      return;
    }
    // skip if XMTP not yet setup
    if (!isChatReady) {
      return;
    }
    setShowPermissionCta(authAddress !== "" && !isPermissionGranted);
  }, [authAddress, isPermissionGranted, showPermissionCta, isChatReady]);

  // resolve the domain for wallet address
  useEffect(() => {
    if (!authAddress) {
      return;
    }

    const resolveName = async () => {
      // resolve the domain of this address (if available)
      const resolution = await getAddressMetadata(authAddress);
      if (resolution?.name) {
        setAuthDomain(resolution.name);
        await localStorageWrapper.setItem(
          DomainProfileKeys.AuthDomain,
          resolution.name.toLowerCase(),
        );
        if (resolution?.imageType !== "default") {
          setAuthAvatar(resolution.avatarUrl);
        }
      }
    };
    void resolveName();
  }, [authAddress]);

  // complete page load steps after sign in confirmed
  useEffect(() => {
    if (!preferences || !authComplete) {
      return;
    }

    // handle message notifications if necessary
    void handleUnreadMessages();

    // update messaging status
    setMessagingEnabled(preferences.MessagingEnabled);
    setIsNewUser(!preferences.HasExistingWallet);

    // take appropriate action on compatibility mode settings
    void handleCompatibilitySettings();
  }, [preferences, authComplete]);

  // determine whether to show the sign in cta
  useEffect(() => {
    if (!showSignInCta || !preferences) {
      return;
    }
    if (preferences.HasExistingWallet) {
      void handleSignIn();
    }
  }, [showSignInCta, preferences]);

  // ensure XMTP is initialized once the page is finished loading
  useEffect(() => {
    if (!authAddress || !isLoaded || isChatReady) {
      return;
    }

    // prepare XMTP for use
    void handlePrepareXmtp();
  }, [authAddress, isChatReady, isLoaded]);

  // open XMTP chat panel if requested
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

  // ensure the sign-in email address is recorded in account state
  useEffect(() => {
    if (authState?.emailAddress) {
      void chromeStorageSet(StorageSyncKey.Account, authState.emailAddress);
    }
  }, [authState]);

  const handleAuthComplete = async () => {
    // set the complete flag
    setAuthComplete(true);

    // cleanup state from authentication attempt
    await chromeStorageRemove(StorageSyncKey.AuthState, "session");

    // if the sign in was initiated by a wallet connection, route the processing
    // back to the connect page now that sign in is completed
    const providerRequest = getProviderRequest();
    if (providerRequest) {
      if (providerRequest.type === "signInRequest") {
        // clear badge count
        await setBadgeCount(0);

        // show the permission CTA and leave the window open if optional
        // permissions are not yet granted
        if (!isPermissionGranted) {
          setShowPermissionCta(true);
          return;
        }
        return;
      }
      navigate("/connect");
    }

    // ensure XMTP is ready
    await handlePrepareXmtp();
  };

  const handleAuthStart = async (
    emailAddress: string,
    password: string,
    loginState: TokenRefreshResponse,
  ) => {
    const s: AuthState = {
      emailAddress,
      password,
      loginState,
      expiration: new Date().getTime() + FIVE_MINUTES,
    };
    setAuthState(s);
    await chromeStorageSet(
      StorageSyncKey.AuthState,
      JSON.stringify(s),
      "session",
    );
  };

  const handlePrepareXmtp = async () => {
    // wait for XMTP to be ready
    chrome.storage.local.onChanged.addListener(changes => {
      if (changes[StorageSyncKey.XmtpKey]) {
        setIsChatReady(true);
        setMessagingEnabled(true);
      }
    });

    // wait a few seconds to avoid a sign in race condition
    await sleep(2000);

    // validate the access token can be retrieved
    const accessToken = await getAccessToken();
    if (!accessToken) {
      await handleLogout(false);
      return;
    }

    // sign into the XMTP account
    await prepareXmtpInBackground(accessToken, authAddress);
  };

  const handlePermissionGranted = async () => {
    // complete the sign wallet sign in state
    setIsPermissionGranted(true);
    setShowPermissionCta(false);
    setAuthComplete(true);

    // create a notification to indicate sign in was successful
    await createNotification(
      `signIn${Date.now()}`,
      theme.wallet.title,
      t("wallet.readyToUse"),
      undefined,
      2,
    );
  };

  const handleCreateWallet = async () => {
    // ensure user is signed out
    await handleLogout(false, false);

    // set state to start creating a wallet
    setIsNewUser(true);
    setLoginClicked(true);
    setShowSignInCta(false);
  };

  const handleSignIn = async () => {
    // ensure user is signed out
    await handleLogout(false, false);

    // set state to prompt user for username and password
    setIsNewUser(false);
    setShowSignInCta(false);
  };

  const handleLogout = async (close = true, showCta = true) => {
    // clear extension storage
    await chromeStorageClear("local");
    await chromeStorageClear("session");
    await chromeStorageClear("sync");

    // clear auth state when showing sign in CTA
    if (showCta) {
      setAuthState(undefined);
      setShowSignInCta(true);
    }

    // reset identity variable state
    setIsBasicDisabled(!showCta);
    setAuthAddress("");
    setAuthDomain("");
    setAuthAvatar(undefined);

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
    if (close) {
      handleClose();
    }
  };

  const handleUnexpectedClose = (m: any) => (_e: BeforeUnloadEvent) => {
    // called when the user manually closes the connection window, without
    // interacting with any of the buttons
    if (m) {
      void handleError(
        getResponseType(m.type),
        new Error("user closed wallet"),
      );
    }
    return;
  };

  const handleFocusPopups = async () => {
    // focus the windows
    const focussedPopups = await focusExtensionWindows();

    // close window if popups were located
    if (focussedPopups > 0) {
      handleClose();
      return true;
    }
    return false;
  };

  const handleError = async (type: ResponseType, e: Error) => {
    // handle provider error and cancel the operation
    Logger.error(e, "Popup", "handled provider error", type);
    await chrome.runtime.sendMessage({
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

  const handleUnreadMessages = async () => {
    // determine if there is an unread message badge
    const badgeCount = await getBadgeCount(BadgeColor.Blue);
    if (badgeCount === 0) {
      return;
    }

    // clear the unread count
    await setBadgeCount(0, BadgeColor.Blue);

    // do not show the snackbar if the user is already attempting
    // to open the conversation
    const xmtpChatAddress = getXmtpChatAddress();
    if (xmtpChatAddress) {
      return;
    }

    // show a message notification if so
    enqueueSnackbar(
      <Typography variant="body2">
        You have <b>{badgeCount}</b> unread message{badgeCount > 0 ? "s" : ""}
      </Typography>,
      {
        variant: "info",
        key: SnackbarKey.UnreadMessage,
        action: (
          <Box display="flex" width="100%">
            <Button
              variant="text"
              size="small"
              color="primary"
              className={classes.actionButton}
              onClick={() => closeSnackbar(SnackbarKey.UnreadMessage)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="text"
              size="small"
              color="primary"
              className={classes.actionButton}
              onClick={handleMessagesClicked}
            >
              {t("push.setup.openMessaging")}
            </Button>
          </Box>
        ),
      },
    );
  };

  const handleMessagePopoutClick = async (address?: string) => {
    await openSidePanel({address});
  };

  const handleMessagesClicked = async () => {
    // determine if a window ID was provided in the query string args
    const queryStringArgs = queryString.parse(window.location.search);
    const windowId = queryStringArgs?.parentWindowId
      ? parseInt(queryStringArgs.parentWindowId as string, 10)
      : undefined;

    // attempt to open a side panel and close the current popup
    if (await openSidePanel({windowId})) {
      handleClose();
      return;
    }

    // simply show the chat in current window if opening the side
    // panel didn't work for some reason (e.g. permissions)
    setIsChatOpen(true);
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

    // do not prompt for this mode until XMTP has been setup
    if (!isChatReady) {
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
      await sleep(12000);

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
    if (!preferences) {
      return;
    }

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
    preferences?.HasExistingWallet ? (
      <Paper className={classes.container} />
    ) : (
      <SignInCta
        onCreateWalletClicked={handleCreateWallet}
        onSignInClicked={handleSignIn}
      />
    )
  ) : showPermissionCta ? (
    <PermissionCta onPermissionGranted={handlePermissionGranted} />
  ) : showSettings ? (
    <Preferences onClose={handleClosePreferences} />
  ) : isLoaded ? (
    <Paper className={classes.container}>
      {isBasicMode && (
        <Header
          title={theme.wallet.title}
          subTitle={t("manage.cryptoWalletDescriptionMobile")}
        />
      )}
      {(config.NODE_ENV as AppEnv) !== "production" && (
        <Box
          className={
            !isBasicMode
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
      <Box className={classes.walletContainer}>
        <Wallet
          mode={isBasicMode ? "basic" : "portfolio"}
          address={authAddress}
          domain={authDomain}
          emailAddress={authState?.emailAddress}
          recoveryPhrase={authState?.password}
          avatarUrl={authAvatar}
          showMessages={messagingEnabled}
          isNewUser={isNewUser}
          loginClicked={loginClicked}
          loginState={authState?.loginState}
          disableBasicHeader
          fullScreenModals
          forceRememberOnDevice
          onLoginInitiated={handleAuthStart}
          onLogout={() => handleLogout(true, false)}
          onError={() => handleLogout(false, false)}
          onDisconnect={isConnected ? handleDisconnect : undefined}
          onSettingsClick={handleShowPreferences}
          onMessagesClick={handleMessagesClicked}
          onMessagePopoutClick={handleMessagePopoutClick}
          onUpdate={async (_t: DomainProfileTabType) => {
            await handleAuthComplete();
          }}
          setButtonComponent={setAuthButton}
          setAuthAddress={setAuthAddress}
        />
        {showFooter && (
          <Box display="flex" flexDirection="column" width="100%">
            {authButton}
          </Box>
        )}
      </Box>
    </Paper>
  ) : (
    <Paper className={classes.container} />
  );
};

export default WalletComp;
