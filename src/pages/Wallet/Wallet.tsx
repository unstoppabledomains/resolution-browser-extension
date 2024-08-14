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

const WalletComp: React.FC = () => {
  const isMounted = useIsMounted();
  const [walletState] = useFireblocksState();
  const {classes} = useExtensionStyles();
  const [authAddress, setAuthAddress] = useState<string>("");
  const [authDomain, setAuthDomain] = useState<string>("");
  const [authAvatar, setAuthAvatar] = useState<string>();
  const [authComplete, setAuthComplete] = useState(false);
  const [authButton, setAuthButton] = useState<React.ReactNode>();
  const [isLoaded, setIsLoaded] = useState(false);

  const handleAuthComplete = () => {
    setAuthComplete(true);
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
          return;
        }

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
        const resolution = await getAddressMetadata(accountEvmAddresses[0].address);
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
        console.error(e, "error", "Wallet", "Configuration");
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
        <Wallet
          mode={"portfolio"}
          address={authAddress}
          domain={authDomain}
          avatarUrl={authAvatar}
          showMessages={false}
          disableInlineEducation={true}
          onLogout={handleLogout}
          onUpdate={(_t: DomainProfileTabType) => {
            handleAuthComplete();
          }}
          setButtonComponent={setAuthButton}
          setAuthAddress={setAuthAddress}
        />
        {!authAddress && (
          <Box display="flex" flexDirection="column" width="100%" mt={2}>
            {authButton}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default WalletComp;
