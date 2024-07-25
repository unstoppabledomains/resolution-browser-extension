// @ts-nocheck

document.addEventListener("handlePersonalSign", function (event) {
  const {message, address} = event.detail;

  chrome.runtime.sendMessage(
    {
      type: "openExtensionPage",
      message,
      address,
    },
    function (response) {
      // Send the response back to the injected script
      // const responseData = { signature: response.signature, error: response.error };
      const responseData = {};
      document.dispatchEvent(
        new CustomEvent("handlePersonalSignResponse", {detail: responseData}),
      );
    },
  );
});
