import config from "../config";

export default async function fetchWalletApi<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  let headers = {
    ...options?.headers,
    "Access-Control-Allow-Credentials": "true",
    "x-api-key": config.PROFILE_API_KEY,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(errorBody.message || "An error occurred");
  }

  return response.json();
}
