import {
  InternalMessageTypes,
  ExternalMessageTypes,
  ProviderEvent,
  ProviderResponseParams,
  getResponseType,
  isExternalRequestType,
  isInternalRequestType,
} from "../../types/wallet/provider";

// register event listeners for all supported internal and external
// messages types
[...ExternalMessageTypes, ...InternalMessageTypes].map((messageType) => {
  document.addEventListener(messageType, (event: ProviderEvent) => {
    chrome.runtime.sendMessage(
      {
        type: messageType,
        params: event?.detail,
      },
      (response: ProviderResponseParams) => {
        // fire response events for internal and external messages
        if (
          isExternalRequestType(messageType) ||
          isInternalRequestType(messageType)
        ) {
          document.dispatchEvent(
            new ProviderEvent(getResponseType(messageType), {
              detail: response,
            }),
          );
        }
      },
    );
  });
});
