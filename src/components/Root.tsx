import React, {useEffect} from "react";
import {
  RouterProvider,
  createMemoryRouter,
  useNavigate,
} from "react-router-dom";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";

import Extension from "../pages/ExtensionMain/Extension";
import Wallet from "../pages/Wallet/Wallet";
import List from "../pages/WebsitesList";
import Loading from "../pages/Loading/Loading";
import SomethingWentWrong from "../pages/Errors/SomethingWentWrong";
import Install from "../pages/InstallPage/Install";
import WalletAccount from "../pages/Wallet/WalletAccount";
import {CssBaseline} from "@mui/material";
import WalletSend from "../pages/Wallet/WalletSend";
import WalletBuy from "../pages/Wallet/WalletBuy";
import WalletReceive from "../pages/Wallet/WalletReceive";
import Layout from "./Layout";
import BaseProvider from "../providers/BaseProvider";

const EntryPoint: React.FC = () => {
  const navigate = useNavigate();

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
  return (
    <BaseProvider>
      <CssBaseline />
      <Layout>
        <Root />
      </Layout>
      <ReactQueryDevtools initialIsOpen={false} />
    </BaseProvider>
  );
};

export default RootApp;
