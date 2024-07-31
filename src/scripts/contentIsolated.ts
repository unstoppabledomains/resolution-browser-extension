document.addEventListener("selectAccountRequest", function () {
  chrome.runtime.sendMessage(
    {
      type: "selectAccountRequest",
    },
    function (response) {
      document.dispatchEvent(
        new CustomEvent("selectAccountResponse", {detail: response}),
      );
    },
  );
});

document.addEventListener("selectChainIdRequest", function () {
  chrome.runtime.sendMessage(
    {
      type: "selectChainIdRequest",
    },
    function (response) {
      document.dispatchEvent(
        new CustomEvent("selectChainIdResponse", {detail: response}),
      );
    },
  );
});

document.addEventListener("signMessageRequest", function (event) {
  chrome.runtime.sendMessage(
    {
      type: "signMessageRequest",
      // @ts-ignore
      params: event.detail,
    },
    function (response) {
      document.dispatchEvent(
        new CustomEvent("signMessageResponse", {detail: response}),
      );
    },
  );
});
