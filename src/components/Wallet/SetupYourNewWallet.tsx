import React, {useEffect, useState} from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  styled,
  IconButton,
  Theme,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import sendBootstrapCodeEmail from "../../api/sendEmail";
import getFireblocksNCW from "../../services/fireblockServices";
import sendJoinRequest from "../../api/sendJoinrequest";
import useAuthorizationTokenConfirm from "../../api/useAuthorizationTokenConfirm";
import {
  StorageSyncKey,
  chromeStorageSyncGet,
  chromeStorageSyncSet,
} from "../../util/chromeStorageSync";
import useAuthorizationTokenSetup from "../../api/useAuthorizationTokenSetup";
import useBootstrapToken from "../../api/useBootstrapToken";
import {pollUntilSuccess} from "../../util/poll";
import useAsyncEffect from "use-async-effect";
import {isValidEmail} from "../../util/validations";
import {makeStyles} from "@mui/styles";
import {WalletConnectionState} from "../../hooks/useWalletState";
import {WalletState} from "../../types";
import useTranslationContext from "../../i18n";
import UnstoppableWalletIcon from "../Icons/UnstoppableWalletIcon";

const useStyles = makeStyles((theme: Theme) => ({
  walletLogoContainer: {
    display: "flex",
    justifyContent: "center",
    paddingTop: "20px",
    paddingBottom: "40px",
  },
  walletLogo: {
    width: "140px !important",
    height: "140px !important",
    color: theme.palette.primary.main,
  },
  textfield: {
    "& .MuiInputBase-root": {
      marginBottom: 16,
      borderRadius: 10,
    },
  },
  continueButton: {
    borderRadius: '10px !important',
    height: "48px",
  },
}));

interface ContinueButtonProps {
  enabled: boolean;
  onClick: () => void;
  caption?: string;
}

const ContinueButton: React.FC<ContinueButtonProps> = ({
  enabled,
  onClick,
  caption = "Continue",
}) => {
  const classes = useStyles();

  return (
    <Button
      disabled={!enabled}
      onClick={onClick}
      variant="contained"
      fullWidth
      className={classes.continueButton}
    >
      {caption}
    </Button>
  );
};

const BackButton: React.FC<{onClick: () => void}> = ({onClick}) => {
  return (
    <Button
      onClick={onClick}
      variant="text"
      fullWidth
      sx={{
        color: "rgba(0, 0, 0, 0.5)",
        textTransform: "none",
        fontSize: 16,
        borderRadius: 16,
      }}
    >
      Back
    </Button>
  );
};

interface EmailInputProps {
  email: string;
  setEmail: (email: string) => void;
  sendEmail: () => void;
}

const EmailInput: React.FC<EmailInputProps> = ({
  email,
  setEmail,
  sendEmail,
}) => {
  const [t] = useTranslationContext();
  const classes = useStyles();
  const [enabledContinueButton, setEnabledContinueButton] = useState(false);

  useEffect(() => {
    if (email.length > 0 && isValidEmail(email)) {
      setEnabledContinueButton(true);
    } else {
      setEnabledContinueButton(false);
    }
  }, [email]);

  return (
    <Box width="100%">
      <TextField
        fullWidth
        label={t("common.enterYourEmail")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && enabledContinueButton) {
            e.preventDefault();
            sendEmail();
          }
        }}
        variant="outlined"
        className={classes.textfield}
      />
      <ContinueButton enabled={enabledContinueButton} onClick={sendEmail} />
    </Box>
  );
};

interface VerifyEmailProps {
  emailBootstrapCode: string;
  password: string;
  setPassword: (password: string) => void;
  setEmailBootstrapCode: (emailBootstrapCode: string) => void;
  getFireblockNCW: (code: string, password: string) => void;
  claimingWallet: boolean;
  walletState: WalletConnectionState;
  updateWalletState: (state: WalletState) => void;
}

const VerifyEmail: React.FC<VerifyEmailProps> = ({
  emailBootstrapCode,
  setPassword,
  password,
  setEmailBootstrapCode,
  getFireblockNCW,
  claimingWallet,
  walletState,
  updateWalletState,
}) => {
  const classes = useStyles();

  return (
    <Box>
      <TextField
        fullWidth
        label="Enter one-time code"
        value={emailBootstrapCode}
        onChange={(e) => setEmailBootstrapCode(e.target.value)}
        variant="outlined"
        disabled={claimingWallet}
        className={classes.textfield}
      />
      <TextField
        fullWidth
        label="Password for wallet"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        variant="outlined"
        disabled={claimingWallet}
        className={classes.textfield}
      />
      <ContinueButton
        enabled={!claimingWallet}
        caption={"Continue"}
        onClick={() => {
          getFireblockNCW(emailBootstrapCode, password);
        }}
      />
      <Box
        sx={{
          paddingTop: "10px",
        }}
      >
        <BackButton
          onClick={() => {
            setEmailBootstrapCode("");
            if (walletState.state === WalletState.VerifyEmail) {
              updateWalletState(WalletState.EmailAndPassword);
            }
          }}
        />
      </Box>
    </Box>
  );
};

interface Props {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  walletState: WalletConnectionState;
  updateWalletState: (state: WalletState) => void;
}

const SetupYourNewWallet: React.FC<Props> = ({
  email,
  setEmail,
  password,
  setPassword,
  walletState,
  updateWalletState,
}) => {
  const classes = useStyles();
  const [t] = useTranslationContext();

  const [bootstrapEmailCode, setBootstrapEmailCode] = useState("");
  const [claimingWallet, setClaimingWallet] = useState(false);
  const [fbNCW, setFbNCW] = useState<any>({});
  const [accessToken, setAccessToken] = useState<string>("");

  const {
    mutate: authorizationTokenConfirmMutation,
    isSuccess: isAuthorizationTokenConfirmSuccess,
  } = useAuthorizationTokenConfirm();

  const {
    mutate: authorizationTokenSetupMutation,
    data: tx,
    isSuccess: isAuthorizationTokenSetupSuccess,
  } = useAuthorizationTokenSetup();

  const {
    mutate: bootstrapTokenMutation,
    data: bootstrapTokenData,
    isSuccess: isBootstrapTokenSuccess,
  } = useBootstrapToken();

  useEffect(() => {
    if (!isAuthorizationTokenConfirmSuccess) {
      return;
    }
    chromeStorageSyncGet(StorageSyncKey.AccessToken).then((accessToken) => {
      console.log("accessToken:", accessToken);
    });
    chromeStorageSyncGet(StorageSyncKey.RefreshToken).then((refreshToken) => {
      console.log("refreshToken:", refreshToken);
    });
    chromeStorageSyncGet(StorageSyncKey.BootstrapToken).then(
      (bootstrapToken) => {
        console.log("bootstrapToken:", bootstrapToken);
      },
    );
  }, [isAuthorizationTokenConfirmSuccess]);

  useAsyncEffect(async () => {
    if (!isAuthorizationTokenSetupSuccess || !tx) {
      return;
    }

    console.log("GET TX", tx);

    const txSignature = await fbNCW.signTransaction(tx.transactionId);
    console.log("txSignature:", txSignature);

    setTimeout(() => {
      authorizationTokenConfirmMutation(accessToken);
      setClaimingWallet(false);
      updateWalletState(WalletState.Account);
    }, 2000);
  }, [isAuthorizationTokenSetupSuccess, tx]);

  useAsyncEffect(async () => {
    if (!isBootstrapTokenSuccess) {
      return;
    }
    console.log("bootstrapTokenData:", bootstrapTokenData);
    const fbNCW = await getFireblocksNCW(
      bootstrapTokenData.deviceId,
      bootstrapTokenData.accessToken,
    );

    chromeStorageSyncSet(StorageSyncKey.DeviceID, bootstrapTokenData.deviceId);
    setFbNCW(fbNCW);
    setAccessToken(bootstrapTokenData.accessToken);
    fbNCW.requestJoinExistingWallet({
      onRequestId: async (requestId) => {
        console.log("requestId:", requestId);
        try {
          await sendJoinRequest(
            requestId,
            bootstrapTokenData.accessToken,
            password,
          );
          const {success: isKeyReady} = await pollUntilSuccess({
            fn: async () => {
              const status = await fbNCW.getKeysStatus();
              console.log("STATUS", status.MPC_CMP_ECDSA_SECP256K1.keyStatus);
              return {
                success: status.MPC_CMP_ECDSA_SECP256K1.keyStatus === "READY",
                value: null,
              };
            },
            attempts: 50,
            interval: 1000,
          });
          if (isKeyReady) {
            authorizationTokenSetupMutation(bootstrapTokenData.accessToken);
          }
        } catch (e) {
          console.error("Error", e);
        }
      },
      onProvisionerFound: () => {
        console.log("Provisioner found");
      },
    });
  }, [isBootstrapTokenSuccess]);

  const sendEmail = async () => {
    await sendBootstrapCodeEmail(email);
    updateWalletState(WalletState.VerifyEmail);
  };

  const getFireblockNCW = async (code: string, password: string) => {
    setClaimingWallet(true);
    bootstrapTokenMutation(code);
  };

  const showBackButton = false;

  return (
    <Box>
      <Box sx={{display: "flex", alignItems: "center"}}>
        {showBackButton && (
          <IconButton
            onClick={() => {
              if (walletState.state === WalletState.VerifyEmail) {
                updateWalletState(WalletState.EmailAndPassword);
              }
            }}
            disabled={claimingWallet}
            aria-label="back"
          >
            <ArrowBackIcon />
          </IconButton>
        )}
        <Typography variant="h1">{t("wallet.title")}</Typography>
        {showBackButton && <Box sx={{width: 40}} />}
      </Box>

      <Box className={classes.walletLogoContainer}>
        <UnstoppableWalletIcon className={classes.walletLogo} />
      </Box>

      {walletState.state === WalletState.EmailAndPassword && (
        <EmailInput email={email} setEmail={setEmail} sendEmail={sendEmail} />
      )}
      {walletState.state === WalletState.VerifyEmail && (
        <VerifyEmail
          emailBootstrapCode={bootstrapEmailCode}
          password={password}
          setPassword={setPassword}
          setEmailBootstrapCode={setBootstrapEmailCode}
          getFireblockNCW={() => getFireblockNCW(bootstrapEmailCode, password)}
          claimingWallet={claimingWallet}
          walletState={walletState}
          updateWalletState={updateWalletState}
        />
      )}
    </Box>
  );
};

export default SetupYourNewWallet;
