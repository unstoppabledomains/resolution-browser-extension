import React, {useEffect} from "react";
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
import Extension from "../pages/ExtensionMain/Extension";
import Wallet from "../pages/Wallet/Wallet";
import Loading from "../pages/Loading/Loading";
import SomethingWentWrong from "../pages/Errors/SomethingWentWrong";
import useUserId from "../hooks/useUserId";
import {LDProvider} from "launchdarkly-react-client-sdk";
import config from "../config";
import {Box} from "@mui/material";
import Connect from "../pages/Wallet/Connect";

const queryClient = new QueryClient();

const EntryPoint: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    switch (window.location.hash) {
      case "#loading":
        navigate("/loading");
        return;
      case "#error":
        navigate("/error");
        return;
      case "#extension":
        navigate("/extension");
        return;
      case "#connect":
        navigate("/connect");
        return;
      case "#wallet":
      default:
        navigate("/wallet");
    }
  }, [navigate]);

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
  /* ******************************
   * Legacy browser extension pages
   * ******************************
   */
  {
    path: "/loading",
    Component: Loading,
  },
  {
    path: "/error",
    Component: SomethingWentWrong,
  },
  {
    path: "/extension",
    Component: Extension,
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
            </LDProvider>
          </DomainConfigProvider>
        </UnstoppableMessagingProvider>
      </BaseProvider>
    </QueryClientProvider>
  );
};

export default RootApp;
