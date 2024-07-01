import config from "../config";

const sendBootstrapCodeEmail = async (email: string): Promise<any> => {
  const url = `${config.WALLET_API_URL}auth/bootstrap/email`;

  const options: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({email}),
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

export default sendBootstrapCodeEmail;
