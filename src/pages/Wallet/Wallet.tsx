import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import {useSnackbar} from "notistack";
import React, {useEffect, useState} from "react";
import useIsMounted from "react-is-mounted-hook";
import {useNavigate} from "react-router-dom";
import useAsyncEffect from "use-async-effect";

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
  useFireblocksState,
  useTranslationContext,
  useUnstoppableMessaging,
} from "@unstoppabledomains/ui-components";
import {WalletBanner} from "@unstoppabledomains/ui-components/components/Wallet/WalletBanner";
import {TokenRefreshResponse} from "@unstoppabledomains/ui-components/lib/types/fireBlocks";

import Header from "../../components/Header";
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
  PermissionType,
  focusExtensionWindows,
  getBadgeCount,
  hasOptionalPermissions,
  openSidePanel,
  requestOptionalPermissions,
  setBadgeCount,
  setIcon,
} from "../../lib/runtime";
import {sendMessageToClient} from "../../lib/wallet/message";
import {
  getWalletPreferences,
  setWalletPreferences,
} from "../../lib/wallet/preferences";
import {getProviderRequest, getXmtpChatAddress} from "../../lib/wallet/request";
import {useExtensionStyles} from "../../styles/extension.styles";
import {AuthState, FIVE_MINUTES} from "../../types/wallet/auth";
import {ResponseType, getResponseType} from "../../types/wallet/provider";
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
  const {classes} = useExtensionStyles();
  const {enqueueSnackbar, closeSnackbar} = useSnackbar();
  const [t] = useTranslationContext();
  const {preferences, refreshPreferences} = usePreferences();
  const {isChatReady, setOpenChat, setIsChatOpen} = useUnstoppableMessaging();
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
  const [isBasicDisabled, setIsBasicDisabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSignInCta, setShowSignInCta] = useState(false);
  const [messagingEnabled, setMessagingEnabled] = useState(false);
  const [banner, setBanner] = useState<React.ReactNode>();

  // indicates that the display mode is basic (or portfolio)
  const showFooter = !authAddress || !authComplete;
  const isBasicMode = showFooter && !loginClicked && !isBasicDisabled;

  // determines if sign-in is complete
  const signInState = getBootstrapState(walletState);
  const isSignInComplete = authComplete || signInState?.custodyState;

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
              setLoginClicked(true);
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
  useAsyncEffect(async () => {
    if (!preferences || !authComplete) {
      return;
    }

    // handle message notifications if necessary
    await handleUnreadMessages();

    // refresh banner
    await handleRefreshBanner();

    // update messaging status
    setMessagingEnabled(preferences.MessagingEnabled);
    setIsNewUser(!preferences.HasExistingWallet);
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
  }, [authAddress, isChatReady]);

  // ensure the sign-in email address is recorded in account state
  useEffect(() => {
    if (authState?.emailAddress) {
      void chromeStorageSet(StorageSyncKey.Account, authState.emailAddress);
    }
  }, [authState]);

  const handleRefreshBanner = async () => {
    // All modes - check app connections banner
    const isAppConnectionEnabled = await hasOptionalPermissions([
      PermissionType.Tabs,
    ]);
    const isAppConnectionCleared = await chromeStorageGet<number>(
      StorageSyncKey.BannerAppPermissions,
    );
    if (!isAppConnectionEnabled && !isAppConnectionCleared) {
      setBanner(
        <Tooltip arrow title={t("extension.appConnectionsDescription")}>
          <Box>
            <WalletBanner
              backgroundColor={theme.palette.primary.main}
              textColor={theme.palette.white}
              icon={<SettingsOutlinedIcon fontSize="small" />}
              action={
                <Box display="flex">
                  <IconButton
                    size="small"
                    color="inherit"
                    onClick={() =>
                      handleEnableAppPermission(
                        StorageSyncKey.BannerAppPermissions,
                        [PermissionType.Tabs],
                      )
                    }
                  >
                    <CheckIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="inherit"
                    onClick={() =>
                      handleEnableAppPermission(
                        StorageSyncKey.BannerAppPermissions,
                      )
                    }
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              }
            >
              {t("manage.enable")} {t("extension.appConnections").toLowerCase()}
              ?
            </WalletBanner>
          </Box>
        </Tooltip>,
      );
      return;
    }

    // UD.me mode - check decentralized browsing banner
    const isBrowsingEnabled = await hasOptionalPermissions([
      PermissionType.DeclarativeNetRequest,
    ]);
    const isBrowsingCleared = await chromeStorageGet<number>(
      StorageSyncKey.BannerDecentralizedBrowsing,
    );
    if (
      !isBrowsingEnabled &&
      !isBrowsingCleared &&
      theme.wallet.type === "udme"
    ) {
      setBanner(
        <Tooltip arrow title={t("extension.decentralizedBrowsingDescription")}>
          <Box>
            <WalletBanner
              backgroundColor={theme.palette.primary.main}
              textColor={theme.palette.white}
              icon={<SettingsOutlinedIcon fontSize="small" />}
              action={
                <Box display="flex">
                  <IconButton
                    size="small"
                    color="inherit"
                    onClick={() =>
                      handleEnableAppPermission(
                        StorageSyncKey.BannerDecentralizedBrowsing,
                        [PermissionType.DeclarativeNetRequest],
                      )
                    }
                  >
                    <CheckIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="inherit"
                    onClick={() =>
                      handleEnableAppPermission(
                        StorageSyncKey.BannerDecentralizedBrowsing,
                      )
                    }
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              }
            >
              {t("manage.enable")}{" "}
              {t("extension.decentralizedBrowsing").toLowerCase()}?
            </WalletBanner>
          </Box>
        </Tooltip>,
      );
      return;
    }

    // UD.me mode - check notifications banner
    const isNotificationEnabled = await hasOptionalPermissions([
      PermissionType.Notifications,
    ]);
    const isNotificationCleared = await chromeStorageGet<number>(
      StorageSyncKey.BannerNotifications,
    );
    if (
      !isNotificationEnabled &&
      !isNotificationCleared &&
      theme.wallet.type === "udme"
    ) {
      setBanner(
        <Tooltip arrow title={t("extension.notificationsDescription")}>
          <Box>
            <WalletBanner
              backgroundColor={theme.palette.primary.main}
              textColor={theme.palette.white}
              icon={<SettingsOutlinedIcon fontSize="small" />}
              action={
                <Box display="flex">
                  <IconButton
                    size="small"
                    color="inherit"
                    onClick={() =>
                      handleEnableAppPermission(
                        StorageSyncKey.BannerNotifications,
                        [PermissionType.Notifications],
                      )
                    }
                  >
                    <CheckIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="inherit"
                    onClick={() =>
                      handleEnableAppPermission(
                        StorageSyncKey.BannerNotifications,
                      )
                    }
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              }
            >
              {t("manage.enable")} {t("common.notifications").toLowerCase()}?
            </WalletBanner>
          </Box>
        </Tooltip>,
      );
      return;
    }

    // no banner required
    setBanner(undefined);
  };

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
        return;
      }
      navigate("/connect");
    }
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

  const handleUseExistingAccount = async (emailAddress: string) => {
    // ensure user is signed out
    await handleLogout(true, false);
    setAuthState({
      emailAddress,
      password: "",
    });
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

  const handleEnableAppPermission = async (
    key: StorageSyncKey,
    request?: PermissionType[],
  ) => {
    await chromeStorageSet(key, Date.now());
    if (request) {
      await requestOptionalPermissions(request);
    }
    await handleRefreshBanner();
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
    setOpenChat(address);
    setIsChatOpen(true);
  };

  const handleMessagesClicked = async () => {
    setIsChatOpen(true);
  };

  const handleSidePanelClicked = async () => {
    await openSidePanel();
    handleClose();
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

  const isInSidePanel = () => {
    return window.innerHeight > 600;
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
  ) : showSettings ? (
    <Preferences onClose={handleClosePreferences} />
  ) : isLoaded ? (
    <Paper className={classes.container}>
      {isBasicMode && (
        <Header title={theme.wallet.title} subTitle={theme.wallet.subTitle} />
      )}
      <Box
        className={classes.walletContainer}
        mt={showFooter && !!authButton && !isSignInComplete ? 6.4 : undefined}
      >
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
          banner={banner}
          disableBasicHeader
          disableSignInHeader={showFooter && !!authButton && !isSignInComplete}
          fullScreenModals
          forceRememberOnDevice
          onLoginInitiated={handleAuthStart}
          onLogout={() => handleLogout(true, false)}
          onError={() => handleLogout(false, false)}
          onUseExistingAccount={handleUseExistingAccount}
          onDisconnect={isConnected ? handleDisconnect : undefined}
          onSettingsClick={handleShowPreferences}
          onSidePanelClick={
            !isInSidePanel() ? handleSidePanelClicked : undefined
          }
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
