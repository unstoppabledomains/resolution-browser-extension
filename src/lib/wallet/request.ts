import queryString from "query-string";
import {ProviderRequest} from "../../types/wallet/provider";

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
