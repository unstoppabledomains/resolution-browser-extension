import {Theme, ThemeProvider} from "@mui/material/styles";
import React from "react";
import {TranslationProvider} from "../i18n";
import Web3ContextProvider from "./Web3ContextProvider";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {LDProvider} from "launchdarkly-react-client-sdk";
import config from "../config";
import useUserId from "../hooks/useUserId";
import theme from "../styles/theme";

type Props = {
  children: React.ReactNode;
  theme?: Theme;
};

const queryClient = new QueryClient();

const BaseProvider: React.FC<Props> = ({children}) => {
  const {userId} = useUserId();

  return (
    <QueryClientProvider client={queryClient}>
      <LDProvider
        clientSideID={config.LD_CLIENT_ID}
        context={{
          kind: "user",
          key: userId,
        }}
      >
        <TranslationProvider>
          <Web3ContextProvider>
            <ThemeProvider theme={theme}>{children}</ThemeProvider>
          </Web3ContextProvider>
        </TranslationProvider>
      </LDProvider>
    </QueryClientProvider>
  );
};

export default BaseProvider;
