import Box from "@mui/material/Box";
import type {Theme} from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {LDProvider} from "launchdarkly-react-client-sdk";
import React, {useEffect, useState} from "react";
import {
  RouterProvider,
  createMemoryRouter,
  useNavigate,
} from "react-router-dom";

import {
  BaseProvider,
  DomainConfigProvider,
  UnstoppableMessagingProvider,
  getTheme,
} from "@unstoppabledomains/ui-components";
import {
  ThemeMode,
  WalletType,
} from "@unstoppabledomains/ui-components/styles/theme";

import config from "../config";
import usePreferences from "../hooks/usePreferences";
import useUserId from "../hooks/useUserId";
import SomethingWentWrong from "../pages/Errors/SomethingWentWrong";
import Extension from "../pages/Legacy/Extension";
import Loading from "../pages/Loading/Loading";
import OnUpdated from "../pages/OnUpdated";
import Connect from "../pages/Wallet/Connect";
import {MessageSidePanel} from "../pages/Wallet/MessageSidePanel";
import Wallet from "../pages/Wallet/Wallet";
import ConnectionProvider from "../providers/ConnectionProvider";

const queryClient = new QueryClient();

const EntryPoint: React.FC = () => {
  const navigate = useNavigate();
  const {preferences} = usePreferences();

  // load the requested extension page
  useEffect(() => {
    // wait for preferences to be loaded
    if (!preferences) {
      return;
    }

    // before handling the requested routing rules, check the extension version
    // to determine if a new version UX should be displayed
    if (config.VERSION_DESCRIPTION !== preferences.VersionInfo) {
      // the user has not yet observed this version, so override the requested
      // page with the new version UX
      navigate("/onUpdated");
      return;
    }

    // load the desired view
    switch (window.location.hash) {
      case "#onUpdated":
        navigate("/onUpdated");
        return;
      case "#legacy":
        navigate("/legacy");
        return;
      case "#loading":
        navigate("/loading");
        return;
      case "#error":
        navigate("/error");
        return;
      case "#connect":
        navigate("/connect");
        return;
      case "#messages":
        navigate("/messages");
        return;
      case "#wallet":
        navigate("/wallet");
        return;
      default:
        navigate(`/${preferences.DefaultView}`);
    }
  }, [navigate, preferences]);

  return <></>;
};

const router = createMemoryRouter([
  /* *******************************
   * Define default routing behavior
   * *******************************
   */
  {
    path: "/",
    Component: EntryPoint,
  },
  /* ****************************
   * Upgrade UX for a new version
   * ****************************
   */
  {
    path: "/onUpdated",
    Component: OnUpdated,
  },
  /* ******************************
   * Legacy browser extension pages
   * ******************************
   */
  {
    path: "/legacy",
    Component: Extension,
  },
  {
    path: "/loading",
    Component: Loading,
  },
  {
    path: "/error",
    Component: SomethingWentWrong,
  },
  /* *****************************
   * Unstoppable Lite Wallet pages
   * *****************************
   */
  {
    // Primary wallet extension view
    path: "/wallet",
    Component: Wallet,
  },
  {
    // Application connect request popup
    path: "/connect",
    Component: Connect,
  },
  {
    // Messaging side panel
    path: "/messages",
    Component: MessageSidePanel,
  },
]);

const Root: React.FC = () => (
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

function RootApp() {
  const {userId} = useUserId();
  const isDarkModeSystemDefault = useMediaQuery("(prefers-color-scheme: dark)");
  const [themeName, setThemeName] = useState<WalletType>();
  const [themeMode, setThemeMode] = useState<ThemeMode>();
  const [theme, setTheme] = useState<Theme>();
  const themeModeKey = "themeMode";

  // set theme state
  useEffect(() => {
    // initialize the theme name
    const name = config.THEME ? config.THEME : "udme";
    setThemeName(name);

    // initialize the theme mode
    const userDefinedMode = localStorage.getItem(themeModeKey);
    const mode = userDefinedMode
      ? userDefinedMode === "dark"
        ? "dark"
        : "light"
      : isDarkModeSystemDefault
        ? "dark"
        : "light";
    setThemeMode(mode);

    // set initial theme
    setTheme(getTheme(name, mode));
  }, [isDarkModeSystemDefault]);

  // dynamically set the page theme
  useEffect(() => {
    if (!themeName || !themeMode) {
      return;
    }
    localStorage.setItem(themeModeKey, themeMode);
    setTheme(getTheme(themeName, themeMode));
  }, [themeName, themeMode]);

  if (!userId) {
    return <div />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BaseProvider theme={theme} mode={themeMode} setMode={setThemeMode}>
        <UnstoppableMessagingProvider>
          <DomainConfigProvider>
            <LDProvider
              clientSideID={config.LD_CLIENT_ID}
              context={{
                kind: "user",
                key: userId,
              }}
            >
              <ConnectionProvider>
                <Box
                  sx={{
                    display: "flex",
                    alignContent: "center",
                    justifyContent: "center",
                    width: "100%",
                  }}
                >
                  <Root />
                </Box>
              </ConnectionProvider>
            </LDProvider>
          </DomainConfigProvider>
        </UnstoppableMessagingProvider>
      </BaseProvider>
    </QueryClientProvider>
  );
}

export default RootApp;
