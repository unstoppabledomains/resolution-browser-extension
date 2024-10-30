import {
  ExternalMessageTypes,
  InternalMessageTypes,
  ProviderEvent,
  ProviderResponseParams,
  getResponseType,
  isClientSideRequestType,
  isExternalRequestType,
  isInternalRequestType,
} from "../../types/wallet/provider";

// register event listeners for all supported internal and external
// messages types
[...ExternalMessageTypes, ...InternalMessageTypes].map(messageType => {
  document.addEventListener(messageType, (e: any) => {
    const event = e as ProviderEvent;
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

// listen for extension events that should be handled in browser window
chrome.runtime.onMessage.addListener((request: ProviderEvent) => {
  if (isClientSideRequestType(request.type)) {
    document.dispatchEvent(new CustomEvent(request.type));
  }
});
