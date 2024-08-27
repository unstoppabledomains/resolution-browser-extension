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
  const [showSettings, setShowSettings] = useState(false);

  const handleAuthComplete = async () => {
    await chromeStorageRemove(StorageSyncKey.AuthState, "session");
    setAuthComplete(true);
  };

  const handleAuthStart = async (emailAddress: string, password: string) => {
    const authState: AuthState = {
      emailAddress,
      password,
      expiration: new Date().getTime() + FIVE_MINUTES,
    };
    await chromeStorageSet(
      StorageSyncKey.AuthState,
      JSON.stringify(authState),
      "session",
    );
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
          const inProgressAuthState = await chromeStorageGet(
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

  const handleLogout = async () => {
    // clear extension storage
    await chromeStorageClear("local");
    await chromeStorageClear("session");
    await chromeStorageClear("sync");

    // reset identity variable state
    setAuthAddress(undefined);
    setAuthDomain(undefined);
    setAuthAvatar(undefined);

    // close the extension window
    window.close();
  };

  const handleShowPreferences = () => {
    setShowSettings(true);
  };

  const handleClosePreferences = () => {
    setShowSettings(false);
  };

  return showSettings ? (
    <Preferences onClose={handleClosePreferences} />
  ) : (
    <Paper className={classes.container}>
      {!authAddress && (
        <Header
          title="Unstoppable Lite Wallet"
          subTitle="A web3 wallet for domainers and their domains"
        />
      )}
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
            isNewUser={true}
            disableInlineEducation={true}
            disableBasicHeader={true}
            fullScreenModals={true}
            onLoginInitiated={handleAuthStart}
            onLogout={handleLogout}
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
