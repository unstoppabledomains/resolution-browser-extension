import React, {useEffect, useState} from "react";
import {Box, Paper} from "@mui/material";
import {
  DomainProfileTabType,
  DomainProfileKeys,
  Wallet,
  useFireblocksState,
  getAddressMetadata,
  getBootstrapState,
  isEthAddress,
} from "@unstoppabledomains/ui-components";
import useIsMounted from "react-is-mounted-hook";
import {useExtensionStyles} from "../../styles/extension.styles";
import {AUTH_STATE_KEY, AuthState, FIVE_MINUTES} from "../../types/wallet/auth";
import {Logger} from "../../lib/logger";

const WalletComp: React.FC = () => {
  const isMounted = useIsMounted();
  const [walletState] = useFireblocksState();
  const {classes} = useExtensionStyles();
  const [authAddress, setAuthAddress] = useState<string>("");
  const [authDomain, setAuthDomain] = useState<string>("");
  const [authAvatar, setAuthAvatar] = useState<string>();
  const [authComplete, setAuthComplete] = useState(false);
  const [authState, setAuthState] = useState<AuthState>();
  const [authButton, setAuthButton] = useState<React.ReactNode>();
  const [isLoaded, setIsLoaded] = useState(false);

  const handleAuthComplete = () => {
    localStorage.removeItem(AUTH_STATE_KEY);
    setAuthComplete(true);
  };

  const handleAuthStart = (emailAddress: string, password: string) => {
    const authState: AuthState = {
      emailAddress,
      password,
      expiration: new Date().getTime() + FIVE_MINUTES,
    };
    localStorage.setItem(AUTH_STATE_KEY, JSON.stringify(authState));
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
          const inProgressAuthState = localStorage.getItem(AUTH_STATE_KEY);
          if (inProgressAuthState) {
            const now = new Date().getTime();
            const state: AuthState = JSON.parse(inProgressAuthState);
            if (state.expiration > 0 && now < state.expiration) {
              setAuthState(state);
              return;
            }
            localStorage.removeItem(AUTH_STATE_KEY);
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
        Logger.error(e, "error", "Wallet", "Configuration");
      } finally {
        setIsLoaded(true);
      }
    };
    void loadWallet();
  }, [isMounted, authComplete]);

  const handleLogout = () => {
    setAuthAddress(undefined);
    setAuthDomain(undefined);
    setAuthAvatar(undefined);
    window.close();
  };

  return (
    <Paper className={classes.container}>
      <Box
        className={classes.walletContainer}
        sx={{
          display: isLoaded ? "flex" : "none",
        }}
      >
        {authState && (
          <Wallet
            mode={authAddress ? "portfolio" : "basic"}
            address={authAddress}
            domain={authDomain}
            emailAddress={authState.emailAddress}
            recoveryPhrase={authState.password}
            avatarUrl={authAvatar}
            showMessages={false}
            disableInlineEducation={true}
            onLoginInitiated={handleAuthStart}
            onLogout={handleLogout}
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
