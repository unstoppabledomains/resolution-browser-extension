import queryString from "query-string";
import {ProviderRequest} from "../../types/wallet/provider";
import {XMTP_CONVERSATION_FLAG} from "../../types/wallet/messages";

export const getProviderRequest = (): ProviderRequest | undefined => {
  const queryStringArgs = queryString.parse(window.location.search);
  if (queryStringArgs.request) {
    const request = JSON.parse(queryStringArgs.request as string);
    if (request.type) {
      return request;
    }
  }
  return undefined;
};

export const getXmtpChatAddress = (): string | undefined => {
  const queryStringArgs = queryString.parse(window.location.search);
  if (queryStringArgs[XMTP_CONVERSATION_FLAG]) {
    return queryStringArgs[XMTP_CONVERSATION_FLAG] as string;
  }
  return undefined;
};
