import React, {useEffect, useState} from "react";
import {Box, TextField, Button, Typography, styled} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {green} from "@mui/material/colors";

import sendBootstrapCodeEmail from "../../api/sendEmail";
import getFireblocksNCW from "../../services/fireblockServices";
import sendJoinRequest from "../../api/sendJoinrequest";
import useAuthorizationTokenConfirm from "../../api/useAuthorizationTokenConfirm";
import {sleep} from "../../util/sleep";
import {
  StorageSyncKey,
  chromeStorageSyncGet,
} from "../../util/chromeStorageSync";
import useAuthorizationTokenSetup from "../../api/useAuthorizationTokenSetup";
import useBootstrapToken from "../../api/useBootstrapToken";
import {useNavigate} from "react-router-dom";

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
  password,
  setPassword,
  sendEmail,
}) => {
  const [enabledContinueButton, setEnabledContinueButton] = useState(false);

  useEffect(() => {
    if (password.length > 0 && email.length > 0) {
      setEnabledContinueButton(true);
    } else {
      setEnabledContinueButton(false);
    }
  }, [email, password]);

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
        Enter your email and password for wallet
      </Typography>
      <Box width="100%">
        <StyledTextField
          fullWidth
          label="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          variant="outlined"
        />
        <StyledTextField
          fullWidth
          label="Password for wallet"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
  setEmailBootstrapCode: (emailBootstrapCode: string) => void;
  getFireblockNCW: (code: string, password: string) => void;
  claimingWallet: boolean;
}

const VerifyEmail: React.FC<VerifyEmailProps> = ({
  emailBootstrapCode,
  password,
  setEmailBootstrapCode,
  getFireblockNCW,
  claimingWallet,
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
          label="Your email setup code"
          value={emailBootstrapCode}
          onChange={(e) => setEmailBootstrapCode(e.target.value)}
          variant="outlined"
          disabled={claimingWallet}
        />
        <ContinueButton
          enabled={!claimingWallet}
          caption={claimingWallet ? "Claiming Wallet" : "Claim Wallet"}
          onClick={() => {
            getFireblockNCW(emailBootstrapCode, password);
          }}
        />
      </Box>
    </Box>
  );
};

const WalletClaimed: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 10,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          gap: 2,
          flexDirection: "column",
        }}
      >
        <CheckCircleIcon style={{color: green[500], fontSize: 100}} />
        <Typography
          sx={{
            fontWeight: 400,
            color: "rgba(0, 0, 0, 0.5)",
          }}
          variant="subtitle1"
          gutterBottom
          textAlign="center"
        >
          Wallet successfully claimed
        </Typography>

        <Button
          variant="contained"
          fullWidth
          onClick={() => {
            navigate("/wallet/account");
          }}
        >
          Go to wallet
        </Button>
      </Box>
    </Box>
  );
};

interface Props {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
}

const SetupYourNewWallet: React.FC<Props> = ({
  email,
  setEmail,
  password,
  setPassword,
}) => {
  enum Step {
    EmailAndPassword,
    VerifyEmail,
    WalletClaimed,
  }

  const [step, setStep] = useState<Step>(Step.EmailAndPassword);
  const [bootstrapEmailCode, setBootstrapEmailCode] = useState("");
  const [claimingWallet, setClaimingWallet] = useState(false);
  const [authTx, setAuthTx] = useState<any>({});
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
    if (isAuthorizationTokenConfirmSuccess) {
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
    }
  }, [isAuthorizationTokenConfirmSuccess]);

  useEffect(() => {
    if (isAuthorizationTokenSetupSuccess) {
      console.log("GET TX", tx);
      fbNCW.signTransaction(tx.transactionId).then((txSignature) => {
        console.log("txSignature:", txSignature);
        authorizationTokenConfirmMutation(accessToken);

        setClaimingWallet(false);
        setStep(Step.WalletClaimed);
      });
    }
  }, [isAuthorizationTokenSetupSuccess]);

  useEffect(() => {
    if (isBootstrapTokenSuccess) {
      console.log("bootstrapTokenData:", bootstrapTokenData);
      getFireblocksNCW(
        bootstrapTokenData.deviceId,
        bootstrapTokenData.accessToken,
      )
        .then((fbNCW) => {
          const checkKeyStatus = async () => {
            for (let i = 1; i <= 50; i++) {
              const status = await fbNCW.getKeysStatus();
              console.log("STATUS", status.MPC_CMP_ECDSA_SECP256K1.keyStatus);
              if (status.MPC_CMP_ECDSA_SECP256K1.keyStatus === "READY") {
                console.log("retrieved key");
                authorizationTokenSetupMutation(bootstrapTokenData.accessToken);
                break;
              }
              await sleep(1000);
            }
          };

          setFbNCW(fbNCW);
          setAccessToken(bootstrapTokenData.accessToken);
          fbNCW.requestJoinExistingWallet({
            onRequestId: async (requestId) => {
              console.log("requestId:", requestId);
              await sendJoinRequest(
                requestId,
                bootstrapTokenData.accessToken,
                password,
              );

              await checkKeyStatus().catch((error) => {
                console.error("Error:", error);
              });
            },
            onProvisionerFound: () => {
              console.log("Provisioner found");
            },
          });
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }
  }, [isBootstrapTokenSuccess]);

  const sendEmail = async () => {
    await sendBootstrapCodeEmail(email);
    setStep(Step.VerifyEmail);
  };

  const getFireblockNCW = async (code: string, password: string) => {
    setClaimingWallet(true);
    bootstrapTokenMutation(code);
  };

  return (
    <Box>
      <Typography
        sx={{
          fontWeight: "600",
        }}
        variant="h6"
        gutterBottom
        textAlign="center"
      >
        Set up your new wallet
      </Typography>
      {step === Step.EmailAndPassword && (
        <EmailAndPassword
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          sendEmail={sendEmail}
        />
      )}
      {step === Step.VerifyEmail && (
        <VerifyEmail
          emailBootstrapCode={bootstrapEmailCode}
          password={password}
          setEmailBootstrapCode={setBootstrapEmailCode}
          getFireblockNCW={() => getFireblockNCW(bootstrapEmailCode, password)}
          claimingWallet={claimingWallet}
        />
      )}
      {step === Step.WalletClaimed && <WalletClaimed />}
    </Box>
  );
};

export default SetupYourNewWallet;
