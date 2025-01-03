import config from "@unstoppabledomains/config";
import {fetchApi, notifyEvent} from "@unstoppabledomains/ui-components";

export const getTwoFactorStatus = async (
  accessToken: string,
): Promise<boolean> => {
  try {
    const otpStatus = await fetchApi<{otpEnabled: boolean}>(`/v1/otp`, {
      method: "GET",
      mode: "cors",
      headers: {
        "Access-Control-Allow-Credentials": "true",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      host: config.WALLETS.HOST_URL,
    });
    return otpStatus.otpEnabled;
  } catch (e) {
    notifyEvent(e, "warning", "Wallet", "Authorization");
  }
  return false;
};

export const getTwoFactorChallenge = async (
  accessToken: string,
): Promise<string | undefined> => {
  try {
    const otpStatus = await fetchApi<{secret: string}>(`/v1/otp`, {
      method: "POST",
      mode: "cors",
      headers: {
        "Access-Control-Allow-Credentials": "true",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      host: config.WALLETS.HOST_URL,
    });
    return otpStatus.secret;
  } catch (e) {
    notifyEvent(e, "warning", "Wallet", "Authorization");
  }
  return undefined;
};

export const verifyTwoFactorChallenge = async (
  accessToken: string,
  code: string,
): Promise<boolean> => {
  try {
    const verificationResult = await fetch(
      `${config.WALLETS.HOST_URL}/v1/otp/verification`,
      {
        method: "POST",
        mode: "cors",
        headers: {
          "Access-Control-Allow-Credentials": "true",
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          token: code,
        }),
      },
    );
    if (verificationResult?.ok) {
      return true;
    }
  } catch (e) {
    notifyEvent(e, "warning", "Wallet", "Authorization");
  }
  return false;
};

export const disableTwoFactor = async (
  accessToken: string,
  code: string,
): Promise<boolean> => {
  try {
    const disableResult = await fetch(`${config.WALLETS.HOST_URL}/v1/otp`, {
      method: "DELETE",
      mode: "cors",
      headers: {
        "Access-Control-Allow-Credentials": "true",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        token: code,
      }),
    });
    if (disableResult?.ok) {
      return true;
    }
  } catch (e) {
    notifyEvent(e, "warning", "Wallet", "Authorization");
  }
  return false;
};
