import config from "../config";
import {
  StorageSyncKey,
  chromeStorageSyncGet,
  chromeStorageSyncRemove,
  chromeStorageSyncSet,
} from "../util/chromeStorageSync";

type RefreshTokenResponse = {
  accessToken: string;
  refreshToken: string;
};

const refreshAuthTokens = async () => {
  const url = `${config.WALLET_API_URL}auth/tokens/refresh`;
  const refreshToken = await chromeStorageSyncGet(StorageSyncKey.RefreshToken);

  const options: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({refreshToken}),
  };

  let data: RefreshTokenResponse;
  try {
    data = await fetchWalletApi<RefreshTokenResponse>(url, options);
  } catch (e) {
    chromeStorageSyncRemove(StorageSyncKey.AccessToken);
    chromeStorageSyncRemove(StorageSyncKey.RefreshToken);
  }

  return data;
};

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

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (e) {
    console.log("Error fetching", e);
  }

  // Test refresh token
  // if accounts update status to have 403

  if (response.status === 401 || response.status === 403) {
    const {accessToken, refreshToken} = await refreshAuthTokens();
    if (accessToken) {
      chromeStorageSyncSet(StorageSyncKey.AccessToken, accessToken);
    }
    if (refreshToken) {
      chromeStorageSyncSet(StorageSyncKey.RefreshToken, refreshToken);
    }
    fetchWalletApi<T>(url, options);
  }

  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(errorBody.message || "An error occurred");
  }

  return response.json();
}
