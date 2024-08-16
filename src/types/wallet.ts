// use Ethereum mainnet and Sepolia by default
export const DEFAULT_CHAINS = [1, 11155111];

// define provider method names
export type ProviderMethod =
  | "eth_requestAccounts"
  | "eth_chainId"
  | "eth_accounts"
  | "eth_sendTransaction"
  | "eth_getTransactionByHash"
  | "personal_sign"
  | "wallet_requestPermissions"
  | "wallet_switchEthereumChain";

// define required EIP-1193 events
export type Eip1193Event =
  | "accountsChanged"
  | "chainChanged"
  | "connect"
  | "disconnect";

// define supported provider permissions
export const ProviderPermissions = ["eth_accounts"] as const;
export type PermissionType = (typeof ProviderPermissions)[number];
export const isPermissionType = (v: string): v is PermissionType => {
  return ProviderPermissions.indexOf(v as PermissionType) !== -1;
};

// define request types
export const MessageTypes = [
  "selectAccountRequest",
  "selectChainIdRequest",
  "requestPermissionsRequest",
  "signMessageRequest",
  "sendTransactionRequest",
  "switchChainRequest",
] as const;
export type RequestType = (typeof MessageTypes)[number];
export const isRequestType = (v: string): v is RequestType => {
  return MessageTypes.indexOf(v as RequestType) !== -1;
};
export type ProviderRequestParams = any[];
export interface ProviderRequest {
  type: RequestType;
  params: ProviderRequestParams;
}

// define response types
export type ResponseType =
  | "selectAccountResponse"
  | "selectChainIdResponse"
  | "requestPermissionsResponse"
  | "signMessageResponse"
  | "sendTransactionResponse"
  | "switchChainResponse";
export const isResponseType = (v: string): v is ResponseType => {
  return isRequestType(v.replaceAll("Response", "Request"));
};
export const getResponseType = (requestType: RequestType): ResponseType => {
  return requestType.replaceAll("Request", "Response") as ResponseType;
};

export interface ProviderResponse extends Event {
  detail: ProviderResponseParams;
}

export type ProviderResponseParams =
  | ProviderAccountResponse
  | ProviderOperationResponse;

export interface ProviderAccountResponse {
  address: string;
  chainId: number;
  permissions?: any[];
  error: string;
}

export interface ProviderOperationResponse {
  response: string;
  error: string;
}

// define custom provider event
export class ProviderEvent extends CustomEvent<ProviderEventParams> {
  constructor(typeName: RequestType | ResponseType, init?: ProviderEventInit) {
    super(typeName, init);
  }
}

interface ProviderEventInit extends CustomEventInit<ProviderEventParams> {
  detail: ProviderEventParams;
}

export type ProviderEventParams =
  | ProviderRequestParams
  | ProviderResponseParams;

// define error messages
export const UnexpectedResponseError = "unexpected response format";
export const UnsupportedPermissionError = "unsupported permission";
export const UnsupportedRequestError = "unsupported message type";
export const InvalidSwitchChainError = "invalid switch chain parameters";
export const InvalidTxError = "invalid transaction parameters";
export const InvalidSignatureError = "invalid signature parameters";
export const ChainNotSupportedError = "chain ID not supported";
export const NotImplementedError = "not yet implemented";
export const NotConnectedError = "wallet is not connected";
