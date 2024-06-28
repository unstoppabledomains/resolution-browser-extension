import config from "../config";

const sendJoinRequest = async (
  walletJoinRequestId: string,
  bootstrapJwt: string,
  recoveryPassphrase: string,
): Promise<void> => {
  const url = `${config.WALLET_API_URL}auth/devices/bootstrap`;

  const options: RequestInit = {
    method: "POST",
    headers: {
      "Access-Control-Allow-Credentials": "true",
      "Content-Type": "application/json",
      Authorization: `Bearer ${bootstrapJwt}`,
    },
    body: JSON.stringify({
      walletJoinRequestId,
      recoveryPassphrase,
    }),
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    return;
  } catch (error) {
    console.error("Failed to fetch data:", error);
  }
};

export default sendJoinRequest;
