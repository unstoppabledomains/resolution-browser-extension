// define provider method names
export type ProviderMethod =
  | "eth_requestAccounts"
  | "eth_chainId"
  | "eth_accounts"
  | "personal_sign"
  | "wallet_requestPermissions";

// define request types
export const MessageTypes = [
  "selectAccountRequest",
  "selectChainIdRequest",
  "requestPermissionsRequest",
  "signMessageRequest",
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
  | "signMessageResponse";

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
