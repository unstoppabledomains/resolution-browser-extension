import React, {useEffect, useState} from "react";
import {Box, TextField, Button, Theme, Typography} from "@mui/material";

import sendBootstrapCodeEmail from "../../api/sendEmail";
import getFireblocksNCW from "../../services/fireblockServices";
import sendJoinRequest from "../../api/sendJoinrequest";
import useAuthorizationTokenConfirm from "../../api/useAuthorizationTokenConfirm";
import {
  StorageSyncKey,
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
import {OperationStatus} from "./OperationStatus";

const useStyles = makeStyles((theme: Theme) => ({
  walletTitleContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
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
  emailVerifyContainer: {
    paddingLeft: "16px",
    paddingRight: "16px",
  },
  walletConfiguringContainer: {
    paddingTop: "80px",
  },
  continueButton: {
    borderRadius: "10px !important",
    height: "48px",
  },
  backButton: {
    borderRadius: "10px !important",
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
  const classes = useStyles();

  return (
    <Button
      onClick={onClick}
      variant="text"
      fullWidth
      className={classes.backButton}
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
  const [t] = useTranslationContext();

  const [enabledContinueButton, setEnabledContinueButton] = useState(false);

  useEffect(() => {
    if (password.length > 0 && emailBootstrapCode.length > 0) {
      setEnabledContinueButton(true);
    } else {
      setEnabledContinueButton(false);
    }
  }, [password, emailBootstrapCode]);

  return (
    <Box className={classes.emailVerifyContainer}>
      <TextField
        fullWidth
        label={t("wallet.enterBootstrapCode")}
        value={emailBootstrapCode}
        onChange={(e) => setEmailBootstrapCode(e.target.value)}
        variant="outlined"
        disabled={claimingWallet}
        className={classes.textfield}
      />
      <TextField
        fullWidth
        label={t("wallet.enterRecoveryPhrase")}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        variant="outlined"
        disabled={claimingWallet}
        className={classes.textfield}
      />
      <ContinueButton
        enabled={enabledContinueButton}
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
  const [configuringWallet, setConfiguringWallet] = useState(false);
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

  useAsyncEffect(async () => {
    if (!isAuthorizationTokenSetupSuccess || !tx) {
      return;
    }

    console.log("GET TX", tx);

    const txSignature = await fbNCW.signTransaction(tx.transactionId);
    console.log("txSignature:", txSignature);

    setTimeout(() => {
      authorizationTokenConfirmMutation(accessToken);
      setConfiguringWallet(false);
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

  const getFireblockNCW = async (code: string) => {
    setConfiguringWallet(true);
    bootstrapTokenMutation(code);
  };

  if (configuringWallet) {
    return (
      <Box>
        <Box className={classes.walletTitleContainer}>
          <Typography variant="h1">{t("wallet.title")}</Typography>
        </Box>

        <Box className={classes.walletConfiguringContainer}>
          <OperationStatus
            label={t("wallet.configuringWallet")}
            success={false}
            error={false}
            icon={<UnstoppableWalletIcon className={classes.walletLogo} />}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box className={classes.walletTitleContainer}>
        <Typography variant="h1">{t("wallet.title")}</Typography>
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
          getFireblockNCW={() => getFireblockNCW(bootstrapEmailCode)}
          claimingWallet={configuringWallet}
          walletState={walletState}
          updateWalletState={updateWalletState}
        />
      )}
    </Box>
  );
};

export default SetupYourNewWallet;
