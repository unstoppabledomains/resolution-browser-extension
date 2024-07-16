import config from "../config";
import {chromeStorageSyncGet, StorageSyncKey} from "../util/chromeStorageSync";

export default async function fetchWalletApi<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  let headers = {
    ...options?.headers,
    "Access-Control-Allow-Credentials": "true",
  };

  if (!options?.headers?.["Authorization"]) {
    let accessToken: string;

    try {
      accessToken = await chromeStorageSyncGet(StorageSyncKey.AccessToken);
    } catch (e) {}

    headers["Authorization"] = `Bearer ${accessToken}`;
  }

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
