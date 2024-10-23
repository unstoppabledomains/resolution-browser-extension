import React, {useEffect, useState} from "react";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import useIsMounted from "react-is-mounted-hook";
import {useExtensionStyles} from "../../styles/extension.styles";
import {
  useUnstoppableMessaging,
  UnstoppableMessaging,
  getBootstrapState,
  useFireblocksState,
  isEthAddress,
} from "@unstoppabledomains/ui-components";
import {Logger} from "../../lib/logger";
import {getXmtpChatAddress} from "../../lib/wallet/request";

export const MessageSidePanel: React.FC = () => {
  const {classes, cx} = useExtensionStyles();
  const isMounted = useIsMounted();
  const [walletState] = useFireblocksState();
  const {isChatReady, isChatOpen, setOpenChat, setIsChatOpen} =
    useUnstoppableMessaging();
  const [address, setAddress] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    const loadWallet = async () => {
      try {
        // get sign in state
        const signInState = getBootstrapState(walletState);
        if (!signInState) {
          return;
        }

        // get wallet addresses
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

        // ensure an address is available
        if (accountEvmAddresses.length === 0) {
          return;
        }

        // use the address
        setAddress(accountEvmAddresses[0].address);
      } catch (e) {
        Logger.warn("unable to load wallet", e);
      }
    };
    void loadWallet();
  }, [isMounted, walletState]);

  useEffect(() => {
    if (!address || !isChatReady) {
      return;
    }
    const loadChat = async () => {
      // determine if a specific chat should be opened
      const xmtpChatAddress = getXmtpChatAddress();

      // open the chat window
      setIsChatOpen(true);
      if (xmtpChatAddress) {
        setOpenChat(xmtpChatAddress);
      }
      setIsLoading(false);
    };
    void loadChat();
  }, [address, isChatReady]);

  const handleOpenMessages = () => {
    setIsChatOpen(true);
  };

  return (
    <Box height="100vh">
      <Box className={cx(classes.contentContainer, classes.fullHeightCentered)}>
        {isLoading || isChatOpen ? (
          <CircularProgress />
        ) : (
          <Button variant="contained" onClick={handleOpenMessages}>
            Open Messages
          </Button>
        )}
        <UnstoppableMessaging
          address={address}
          silentOnboard={true}
          hideIcon={true}
          disableSupportBubble
          inheritStyle
        />
      </Box>
    </Box>
  );
};
