export const EIP_712_KEY = "EIP712Domain";

export interface TypedMessage {
  domain: {
    name: string;
  };
  message: Record<string, string>;
  primaryType: string;
  types: {
    [EIP_712_KEY]: Record<string, string>[];
  };
}
