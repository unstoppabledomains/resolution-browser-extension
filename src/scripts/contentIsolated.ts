import {
  MessageTypes,
  ProviderEvent,
  ProviderResponseParams,
  getResponseType,
} from "../types/wallet";

MessageTypes.map((messageType) => {
  document.addEventListener(messageType, (event: ProviderEvent) => {
    chrome.runtime.sendMessage(
      {
        type: messageType,
        params: event?.detail,
      },
      (response: ProviderResponseParams) => {
        document.dispatchEvent(
          new ProviderEvent(getResponseType(messageType), {
            detail: response,
          }),
        );
      },
    );
  });
});
