import React, {useEffect, useState} from "react";
import {
  RouterProvider,
  createMemoryRouter,
  useNavigate,
} from "react-router-dom";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {
  BaseProvider,
  UnstoppableMessagingProvider,
  DomainConfigProvider,
} from "@unstoppabledomains/ui-components";
import {lightTheme} from "@unstoppabledomains/ui-kit/styles";
import Extension from "../pages/Legacy/Extension";
import Wallet from "../pages/Wallet/Wallet";
import Loading from "../pages/Loading/Loading";
import SomethingWentWrong from "../pages/Errors/SomethingWentWrong";
import useUserId from "../hooks/useUserId";
import {LDProvider} from "launchdarkly-react-client-sdk";
import config from "../config";
import {Box} from "@mui/material";
import Connect from "../pages/Wallet/Connect";
import OnUpdated from "../pages/OnUpdated";
import {compareVersions} from "compare-versions";
import usePreferences from "../hooks/usePreferences";
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
    if (
      compareVersions(
        chrome.runtime.getManifest().version, // currently installed version
        preferences.Version, // last observed version
      )
    ) {
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
]);

const Root: React.FC = () => (
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

const RootApp = () => {
  const {userId} = useUserId();

  if (!userId) {
    return <div></div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BaseProvider theme={lightTheme}>
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
};

export default RootApp;
