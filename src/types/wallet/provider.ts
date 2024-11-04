import {WalletPreferences} from "./preferences";

// define provider method names
export type ProviderMethod =
  | "eth_requestAccounts"
  | "eth_chainId"
  | "eth_accounts"
  | "eth_sendTransaction"
  | "eth_signTypedData_v4"
  | "eth_blockNumber"
  | "eth_getTransactionReceipt"
  | "eth_call"
  | "eth_estimateGas"
  | "eth_getTransactionByHash"
  | "personal_sign"
  | "wallet_requestPermissions"
  | "wallet_switchEthereumChain";

export const ProviderMethodsWithPrompt: ProviderMethod[] = [
  "eth_requestAccounts",
  "wallet_requestPermissions",
  "wallet_switchEthereumChain",
  "personal_sign",
  "eth_signTypedData_v4",
  "eth_sendTransaction",
];

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

// define external message types
export const ExternalMessageTypes = [
  "accountRequest",
  "chainIdRequest",
  "requestPermissionsRequest",
  "selectAccountRequest",
  "signMessageRequest",
  "signTypedMessageRequest",
  "sendTransactionRequest",
  "switchChainRequest",
] as const;
export type ExternalRequestType = (typeof ExternalMessageTypes)[number];
export const isExternalRequestType = (v: string): v is ExternalRequestType => {
  return ExternalMessageTypes.indexOf(v as ExternalRequestType) !== -1;
};
export const isConnectionRequired = (v: ExternalRequestType): boolean => {
  return [
    "accountRequest",
    "signMessageRequest",
    "signTypedMessageRequest",
    "sendTransactionRequest",
  ].includes(v);
};

// define internal message types
export const InternalMessageTypes = [
  "closeWindowRequest",
  "getPreferencesRequest",
  "getResolutionRequest",
  "getDomainProfileRequest",
  "newTabRequest",
  "queueRequest",
  "signInRequest",
  "xmtpReadyRequest",
  "prepareXmtpRequest",
] as const;
export type InternalRequestType = (typeof InternalMessageTypes)[number];
export const isInternalRequestType = (v: string): v is InternalRequestType => {
  return InternalMessageTypes.indexOf(v as InternalRequestType) !== -1;
};

// define client side message types
export const ClientSideMessageTypes = [
  "refreshRequest",
  "disconnectRequest",
] as const;
export type ClientSideRequestType = (typeof ClientSideMessageTypes)[number];
export const isClientSideRequestType = (
  v: string,
): v is ClientSideRequestType => {
  return ClientSideMessageTypes.indexOf(v as ClientSideRequestType) !== -1;
};

// define a provider request interface
export type ProviderRequestParams = any[];

export interface ProviderRequest {
  type: ExternalRequestType | InternalRequestType;
  params: ProviderRequestParams;
}

// define response types
export type ResponseType =
  | "accountResponse"
  | "chainIdResponse"
  | "requestPermissionsResponse"
  | "selectAccountResponse"
  | "signMessageResponse"
  | "signTypedMessageResponse"
  | "sendTransactionResponse"
  | "switchChainResponse"
  | "getPreferencesResponse"
  | "getDomainProfileResponse"
  | "getResolutionResponse"
  | "prepareXmtpResponse";
export const isResponseType = (v: string): v is ResponseType => {
  return isExternalRequestType(v.replaceAll("Response", "Request"));
};
export const getResponseType = (
  requestType: InternalRequestType | ExternalRequestType,
): ResponseType => {
  return requestType.replaceAll("Request", "Response") as ResponseType;
};

export interface ProviderResponse extends Event {
  detail: ProviderResponseParams;
}

export type ProviderResponseParams =
  | ProviderAccountResponse
  | ProviderOperationResponse
  | ProviderPreferenceResponse
  | ProviderResolutionResponse
  | ProviderDomainProfileResponse;

export interface ProviderAccountResponse {
  address: string;
  chainId: number;
  permissions?: any[];
  error?: string;
}

export interface ProviderOperationResponse {
  response?: string;
  error?: string;
}

export interface ProviderPreferenceResponse {
  preferences: WalletPreferences;
  error?: string;
}

export interface ProviderResolutionResponse {
  address: string;
  domain: string;
  avatar?: string;
  error?: string;
}

export interface ProviderDomainProfileResponse {
  profile: any;
  error?: string;
}

// define custom provider event
export class ProviderEvent extends CustomEvent<ProviderEventParams> {
  constructor(
    typeName: ExternalRequestType | InternalRequestType | ResponseType,
    init?: ProviderEventInit,
  ) {
    if (isExternalRequestType(typeName)) {
      // append hostname to params
      const initParams = (init ? init.detail : []) as any[];
      initParams.push(window.location.hostname);
      init = {
        detail: initParams,
      };
    }
    super(typeName, init);
  }
}

export type ProviderEventResponse = ProviderResponseParams & {
  type: string;
};

interface ProviderEventInit extends CustomEventInit<ProviderEventParams> {
  detail: ProviderEventParams;
}

export type ProviderEventParams =
  | ProviderRequestParams
  | ProviderResponseParams;

// default error code
export const PROVIDER_CODE_USER_ERROR = 4001;
export const PROVIDER_CODE_NOT_IMPLEMENTED = 4200;
export const PROVIDER_CODE_DISCONNECTED = 4900;

// define error messages
export const UnexpectedResponseError = "unexpected response format";
export const UnsupportedPermissionError = "unsupported permission";
export const UnsupportedRequestError = "unsupported message type";
export const UnsupportedMethodError = "unsupported provider method";
export const InvalidSwitchChainError = "invalid switch chain parameters";
export const InvalidTxError = "invalid transaction parameters";
export const InvalidSignatureError = "invalid signature parameters";
export const InvalidTypedMessageError = "invalid typed message";
export const ChainNotSupportedError = "chain ID not supported";
export const NotConnectedError = "wallet is not connected";
