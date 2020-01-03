import Resolution from "@unstoppabledomains/resolution";
import ext from "./utils/ext";

const resolution = new Resolution();

chrome.browserAction.setPopup({ popup: "popup.html" });

ext.runtime.onInstalled.addListener(details => {
  if (details.reason == "install") {
    chrome.tabs.create({ url: ext.extension.getURL("index.html?welcome") });
  }
  // else if (details.reason == "update") {
  //   var thisVersion = chrome.runtime.getManifest().version;
  // }
  console.log("Installed!");
});

ext.webRequest.onBeforeRequest.addListener(
  requestDetails => {
    console.log("Alt Url Requested: " + requestDetails.url);
    var url = new URL(requestDetails.url);

    redirectHostnameToGateway(url.hostname, requestDetails);
  },
  {
    urls: ["*://*.crypto/*", "*://*.zil/*"],
    types: ["main_frame"]
  }
);

// TODO: Add alternate search engines

ext.webRequest.onBeforeRequest.addListener(
  requestDetails => {
    const q = new URL(requestDetails.url).searchParams.get("q").trim();
    if (!q || !isValidDNSHostname(q) || !/\.(zil|crypto)$/.test(q)) {
      return;
    }

    redirectHostnameToGateway(q, requestDetails);
  },
  { urls: ["*://www.google.com/search*"], types: ["main_frame"] },
  ["blocking"]
);

chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.status === "complete") {
    sessionStorage.setItem("loading_status_for_tab" + tabId, "complete");
    console.log("Tab finished loading", info.status);
  }
});

function redirectHostnameToGateway(hostname, requestDetails) {
  if (
    sessionStorage.getItem(
      "loading_status_for_tab" + requestDetails["tabId"]
    ) == "loading" ||
    requestDetails["method"] != "GET"
  ) {
    return;
  }
  sessionStorage.setItem(
    "loading_status_for_tab" + requestDetails["tabId"],
    "loading"
  );

  console.log("Showing loading page:");
  ext.tabs.query({ active: true, currentWindow: true }, async arrayOfTabs => {
    const activeTabId = arrayOfTabs[0].id;

    ext.tabs.update(activeTabId, { url: ext.extension.getURL("loading.html") });

    const hash = await resolution.ipfsHash(hostname);
    const gatewayUrl = "https://cloudflare-ipfs.com/ipfs/" + hash;
    console.log("Gateway url:", gatewayUrl);
    ext.tabs.update(activeTabId, { url: gatewayUrl });
  });

  return { cancel: true };
}

function isValidDNSHostname(hostname) {
  const labels = hostname.split(".");
  if (labels[labels.length - 1] === "") {
    labels.pop();
  }
  return (
    labels.every(label =>
      /^(?![0-9]+$)(?!.*-$)(?!-)[a-zA-Z0-9-]{1,63}$/.test(label)
    ) && labels.reduce((a, v) => v.length + a, 0) < 253
  );
}
