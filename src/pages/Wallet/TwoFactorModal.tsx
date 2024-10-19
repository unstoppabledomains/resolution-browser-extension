import React, {useEffect, useState} from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import {useExtensionStyles} from "../../styles/extension.styles";
import {Modal} from "@unstoppabledomains/ui-components";
import ManageInput from "@unstoppabledomains/ui-components/components/Manage/common/ManageInput";
import useFireblocksAccessToken from "@unstoppabledomains/ui-components/hooks/useFireblocksAccessToken";
import {setWalletPreferences} from "../../lib/wallet/preferences";
import {WalletPreferences} from "../../types/wallet/preferences";
import {
  disableTwoFactor,
  getTwoFactorChallenge,
  getTwoFactorStatus,
  verifyTwoFactorChallenge,
} from "../../lib/wallet/2fa";
import CircularProgress from "@mui/material/CircularProgress";
import {QRCode} from "react-qrcode-logo";
import {PreferenceSection} from "./Preferences";
import {StorageSyncKey, chromeStorageGet} from "../../lib/chromeStorage";

interface TwoFactorModalProps {
  open?: boolean;
  onClose: () => void;
  preferences: WalletPreferences;
  setPreferences: (v: WalletPreferences) => void;
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({
  open,
  onClose,
  preferences,
  setPreferences,
}) => {
  const {classes, cx} = useExtensionStyles();
  const getAccessToken = useFireblocksAccessToken();
  const [accessToken, setAccessToken] = useState("");
  const [emailAddress, setEmailAddress] = useState<string>();
  const [qrCodeContent, setQrCodeContent] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [otp, setOtp] = useState<string>();

  useEffect(() => {
    const loadAccessToken = async () => {
      setAccessToken(await getAccessToken());
      setEmailAddress(await chromeStorageGet(StorageSyncKey.Account));
    };
    void loadAccessToken();
  }, []);

  useEffect(() => {
    if (!accessToken || !emailAddress) {
      return;
    }
    const loadStatus = async () => {
      // retrieve status
      const enabled = await getTwoFactorStatus(accessToken);
      updateStatus(enabled);

      // if not enabled, retrieve QR code data
      if (!enabled) {
        const challenge = await getTwoFactorChallenge(accessToken);
        const encodedChallenge = `otpauth://totp/${encodeURIComponent(emailAddress)}?secret=${challenge}`;
        setQrCodeContent(encodedChallenge);
      }
    };
    void loadStatus();
  }, [accessToken, emailAddress]);

  const handleClick = async () => {
    // enable or disable the configuration
    const operationFn = preferences.TwoFactorAuth.Enabled
      ? disableTwoFactor
      : verifyTwoFactorChallenge;

    // perform the requested operation
    if (await operationFn(accessToken, otp)) {
      // update the configuration settings
      await updateStatus(!preferences.TwoFactorAuth.Enabled);
    } else {
      setErrorMessage(
        "Invalid two-factor code. Check your authenticator app and try again.",
      );
      setOtp("");
      return;
    }

    // close the modal
    onClose();
  };

  const handleChange = (_id: string, value: string) => {
    setErrorMessage("");
    setOtp(value);
  };

  const handleKeyDown: React.KeyboardEventHandler = (event) => {
    if (event.key === "Enter") {
      void handleClick();
    }
  };

  const updateStatus = async (enabled: boolean) => {
    preferences.TwoFactorAuth.Enabled = enabled;
    setPreferences({...preferences});
    await setWalletPreferences(preferences);
  };

  return (
    <Modal open={open} onClose={onClose} noModalHeader={true}>
      <Box mt={-3} width="100%">
        <PreferenceSection
          title={
            preferences?.TwoFactorAuth?.Enabled
              ? "Disable Two-Factor Authentication"
              : "Enable Two-Factor Authentication"
          }
          description={
            preferences?.TwoFactorAuth?.Enabled
              ? "Two-Factor Authentication (2FA) is highly recommended to ensure your wallet is secure. Use caution if you proceed to disable 2FA."
              : "Scan the QR code below with any authenticator app, such as Google Authenticator."
          }
        >
          <Box
            className={cx(classes.walletContainer, classes.contentContainer)}
          >
            {!preferences?.TwoFactorAuth?.Enabled &&
              (qrCodeContent ? (
                <QRCode
                  value={qrCodeContent}
                  size={200}
                  qrStyle={"dots"}
                  ecLevel={"L"}
                />
              ) : (
                <CircularProgress className={classes.loadingSpinner} />
              ))}
            <Box mt={1} mb={2} width="100%">
              <ManageInput
                id="otp"
                value={otp}
                label="Two-Factor Code"
                placeholder="Enter code from authenticator app"
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                error={errorMessage && errorMessage.length > 0}
                errorText={errorMessage}
              />
            </Box>
            <Button
              variant="contained"
              fullWidth
              onClick={handleClick}
              disabled={!otp}
            >
              {preferences?.TwoFactorAuth?.Enabled
                ? "Disable 2FA"
                : "Enable 2FA"}
            </Button>
          </Box>
        </PreferenceSection>
      </Box>
    </Modal>
  );
};
