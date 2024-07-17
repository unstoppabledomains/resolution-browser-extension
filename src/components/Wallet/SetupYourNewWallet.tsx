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
import UnstoppableWalletIcon from "jsx:../../assets/icons/UnstoppableWallet.svg";
import {WalletConnectionState} from "../../hooks/useWalletState";
import {WalletState} from "../../types";

const StyledTextField = styled(TextField)({
  "& .MuiInputBase-root": {
    marginBottom: 16,
    borderRadius: 20,
  },
});

const ContinueCustomButton = styled(Button)({
  backgroundColor: "#007AFF",
  color: "white",
  padding: "10px 15px",
  fontSize: "16px",
  textTransform: "none",
  borderRadius: "16px",
  boxShadow: "0px 4px 10px rgba(0, 122, 255, 0.25)",
  "&:hover": {
    backgroundColor: "#005ECB",
  },
});

const useStyles = makeStyles((theme: Theme) => ({
  iconContainer: {},
  pictureContainer: {
    display: "flex",
    justifyContent: "center",
  },
  imageWrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: 40,
    height: 40,
  },
  icon: {},
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
  return (
    <ContinueCustomButton
      disabled={!enabled}
      onClick={onClick}
      variant="contained"
      fullWidth
    >
      {caption}
    </ContinueCustomButton>
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

interface EmailAndPasswordProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  sendEmail: () => void;
}

const EmailAndPassword: React.FC<EmailAndPasswordProps> = ({
  email,
  setEmail,
  sendEmail,
}) => {
  const [enabledContinueButton, setEnabledContinueButton] = useState(false);

  useEffect(() => {
    if (email.length > 0 && isValidEmail(email)) {
      setEnabledContinueButton(true);
    } else {
      setEnabledContinueButton(false);
    }
  }, [email]);

  return (
    <Box>
      <Typography
        sx={{
          paddingBottom: 4,
          fontWeight: 400,
          color: "rgba(0, 0, 0, 0.5)",
        }}
        variant="subtitle1"
        gutterBottom
        textAlign="center"
      >
        Enter your wallet's email address
      </Typography>
      <Box width="100%">
        <StyledTextField
          fullWidth
          label="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          variant="outlined"
        />
        <ContinueButton enabled={enabledContinueButton} onClick={sendEmail} />
      </Box>
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
  return (
    <Box>
      <Typography
        sx={{
          paddingBottom: 4,
          fontWeight: 400,
          color: "rgba(0, 0, 0, 0.5)",
        }}
        variant="subtitle1"
        gutterBottom
        textAlign="center"
      >
        Check your inbox for the verification code and enter it below
      </Typography>
      <Box width="100%">
        <StyledTextField
          fullWidth
          label="Enter one-time code"
          value={emailBootstrapCode}
          onChange={(e) => setEmailBootstrapCode(e.target.value)}
          variant="outlined"
          disabled={claimingWallet}
        />
        <StyledTextField
          fullWidth
          label="Password for wallet"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          variant="outlined"
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
      <Box className={classes.iconContainer}>
        <Box className={classes.pictureContainer}>
          <Box className={classes.imageWrapper}>
            <Box className={classes.icon}>
              <UnstoppableWalletIcon />
            </Box>
          </Box>
        </Box>
      </Box>
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
        <Typography
          sx={{
            alignSelf: "center",
            fontWeight: "600",
            flexGrow: 1,
            textAlign: "center",
          }}
          variant="h6"
          gutterBottom
        >
          Set up your new wallet
        </Typography>
        {showBackButton && <Box sx={{width: 40}} />}
      </Box>

      {walletState.state === WalletState.EmailAndPassword && (
        <EmailAndPassword
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          sendEmail={sendEmail}
        />
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
