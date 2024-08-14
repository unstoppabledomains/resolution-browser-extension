import {
  MessageTypes,
  ProviderEvent,
  ProviderResponseParams,
  ResponseType,
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
          new ProviderEvent(
            messageType.replace("Request", "Response") as ResponseType,
            {
              detail: response,
            },
          ),
        );
      },
    );
  });
});
