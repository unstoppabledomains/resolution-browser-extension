import config from "../config";
import QueryString from "qs";
import {
  AccountAsset,
  GetEstimateTransactionResponse,
  GetOperationListResponse,
  GetOperationResponse,
  GetOperationStatusResponse,
  OperationStatus,
} from "../types";
import fetchWalletApi from "./fetchWalletApi";

export const getEstimateTransferResponse = (
  accountId: string,
  asset: AccountAsset,
  destinationAddress: string,
  amount: string,
) => {
  const url = `${config.WALLET_API_URL}estimates/accounts/${accountId}/assets/${asset.id}/transfers`;

  return fetchWalletApi<GetEstimateTransactionResponse>(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      destinationAddress,
      amount,
    }),
  });
};

export enum SendCryptoStatusMessage {
  CHECKING_QUEUE = "Checking queued transfers...",
  STARTING_TRANSACTION = "Starting transfer...",
  WAITING_TO_SIGN = "Waiting to approve transfer...",
  SIGNING = "Approving transfer...",
  SUBMITTING_TRANSACTION = "Submitting transfer...",
  WAITING_FOR_TRANSACTION = "Waiting for transfer to complete...",
  TRANSACTION_COMPLETED = "Transfer completed!",
  TRANSACTION_FAILED = "Transfer failed",
}

export const cancelPendingOperations = async (
  accountId: string,
  assetId: string,
): Promise<GetOperationListResponse> => {
  const opsToCancel = await getOperationList(accountId, assetId);

  await Promise.all(
    opsToCancel.items.map(async (operation) => {
      await cancelOperation(operation.id);
    }),
  );

  return opsToCancel;
};

export const getOperationList = async (
  accountId: string,
  assetId: string,
  status: OperationStatus[] = [
    OperationStatus.QUEUED,
    OperationStatus.SIGNATURE_REQUIRED,
  ],
): Promise<GetOperationListResponse> => {
  const url = `${config.WALLET_API_URL}operations?${QueryString.stringify(
    {
      accountId,
      assetId,
      status,
    },
    {arrayFormat: "repeat"},
  )}`;

  return await fetchWalletApi(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const cancelOperation = async (operationId: string): Promise<void> => {
  const url = `${config.WALLET_API_URL}operations/${operationId}`;

  return await fetchWalletApi(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const getOperationStatus = async (
  operationId: string,
): Promise<GetOperationStatusResponse> => {
  const url = `${config.WALLET_API_URL}operations/${operationId}`;

  return await fetchWalletApi(url, {
    method: "GET",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const getTransferOperationResponse = (
  asset: AccountAsset,
  destinationAddress: string,
  amount: number,
) => {
  const url = `${config.WALLET_API_URL}accounts/${asset.accountId}/assets/${asset.id}/transfers`;

  return fetchWalletApi<GetOperationResponse>(url, {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      destinationAddress,
      amount: String(amount),
    }),
  });
};
