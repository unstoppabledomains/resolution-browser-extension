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
