import {
  InternalMessageTypes,
  ExternalMessageTypes,
  ProviderEvent,
  ProviderResponseParams,
  getResponseType,
  isExternalRequestType,
} from "../../types/wallet";

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
        // fire response events for external messages
        if (isExternalRequestType(messageType)) {
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
