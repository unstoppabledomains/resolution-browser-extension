import React, {useEffect} from "react";
import {
  RouterProvider,
  createMemoryRouter,
  useNavigate,
} from "react-router-dom";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";

import Extension from "../pages/ExtensionMain/Extension";
import Wallet from "../pages/Wallet/Wallet";
import List from "../pages/WebsitesList";
import Loading from "../pages/Loading/Loading";
import SomethingWentWrong from "../pages/Errors/SomethingWentWrong";
import Install from "../pages/InstallPage/Install";
import useUserId from "../hooks/useUserId";
import {LDProvider} from "launchdarkly-react-client-sdk";
import config from "../config";
import UserIdService from "../services/userIdService";
import WalletAccount from "../pages/Wallet/WalletAccount";
import {ThemeProvider} from "@mui/styles";
import theme from "../styles/theme";
import {CssBaseline} from "@mui/material";
import WalletSend from "../pages/Wallet/WalletSend";
import WalletBuy from "../pages/Wallet/WalletBuy";
import WalletReceive from "../pages/Wallet/WalletReceive";
import Layout from "./Layout";

const queryClient = new QueryClient();
const userIdService = new UserIdService();

const EntryPoint: React.FC = () => {
  const navigate = useNavigate();
  const {userId, isLoading, error} = useUserId();

  useEffect(() => {
    if (window.location.hash === "#install") {
      navigate("/install");
      return;
    }

    if (window.location.hash === "#error") {
      navigate("/error");
      return;
    }

    if (window.location.hash === "#loading") {
      navigate("/loading");
      return;
    }

    if (window.location.hash === "#list") {
      navigate("/list");
      return;
    }

    navigate("/wallet");
  }, [navigate]);

  return <></>;
};

const router = createMemoryRouter([
  {
    path: "/install",
    Component: Install,
  },
  {
    path: "/list",
    Component: List,
  },
  {
    path: "/loading",
    Component: Loading,
  },
  {
    path: "/error",
    Component: SomethingWentWrong,
  },
  {
    path: "/",
    Component: EntryPoint,
  },
  {
    path: "/extension",
    Component: Extension,
  },
  {
    path: "/wallet",
    Component: Wallet,
  },
  {
    path: "/wallet/account",
    Component: WalletAccount,
  },
  {
    path: "/wallet/send",
    Component: WalletSend,
  },
  {
    path: "/wallet/buy",
    Component: WalletBuy,
  },
  {
    path: "/wallet/receive",
    Component: WalletReceive,
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
      <LDProvider
        clientSideID={config.LD_CLIENT_ID}
        context={{
          kind: "user",
          key: userId,
        }}
      >
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Layout>
            <Root />
          </Layout>
        </ThemeProvider>
      </LDProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default RootApp;
