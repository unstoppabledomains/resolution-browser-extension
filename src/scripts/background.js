import ext from "./utils/ext";

console.log("Loaded Crypto Browser");

var gateway = "127.0.0.1";
var port = "7878";
var access = "PROXY";
var config = {
  mode: "pac_script",
  pacScript: {
    data: "function FindProxyForURL(url, host) {\n" +
    "  if (dnsDomainIs(host, '.eth'))\n" +
    "    return '"+access+" "+gateway+":"+port+"';\n" +
    "  return 'DIRECT';\n" +
    "}"
  }
};
chrome.proxy.settings.set({value: config, scope: 'regular'},function() {});
console.log('Set gateway: ' + JSON.stringify((config["pacScript"])));

ext.webRequest.onBeforeRequest.addListener(
  loadENSURL,
  {urls: ["*://*.eth/*"], types: ["main_frame"]}
);

function loadENSURL(requestDetails) {
  console.log("Eth Url Requested: " + requestDetails.url);
  var urlObject = new URL(requestDetails.url);
  var domainString = getDomainStringOnly(urlObject.hostname);
  return;

  redirectToENSDomain(domainString, "eth", requestDetails, urlObject.pathname + urlObject.hash, requestDetails.url); //Setting .eth statically as the tld for now
}

ext.webRequest.onBeforeRequest.addListener(
 respondToGoogleSearch,
 {urls: ["*://www.google.com/search*"], types: ["main_frame"]},
 ["blocking"] //TODO: Add alternate search engines
);

function respondToGoogleSearch(requestDetails) {
  var query = getQueryVariable(requestDetails.url);
  if (!query || !query.endsWith(".eth") || (/\s/g.test(query))) {
    return;
  }

  console.log("Google Search Query: " + query);
  var domainString = getDomainStringOnly(query);
  redirectToENSDomain(domainString, "eth", requestDetails);
}

chrome.tabs.onUpdated.addListener(function (tabId , info) {
  if (info.status === 'complete') {
    sessionStorage.setItem("loading_status_for_tab" + tabId, 'complete');
    console.log("Tab finished loading", info.status);
  }
});

function getQueryVariable(urlString)
{
	var urlObject = new URL(urlString);
	var queryString = urlObject.searchParams.get("q");
	return queryString;
}

function getDomainStringOnly(fullDomainString) {
  var index = fullDomainString.lastIndexOf('.eth');
  return [fullDomainString.slice(0, index), fullDomainString.slice(index + 1)][0];
}

function redirectToENSDomain(domainString, tld, requestDetails, path, fullUrl)
{
  if (sessionStorage.getItem("loading_status_for_tab" + requestDetails['tabId']) == 'loading' || requestDetails["method"] != "GET") {
    return;
  }
  sessionStorage.setItem("loading_status_for_tab" + requestDetails['tabId'], 'loading');

  fullUrl = "http://" + domainString + "." + tld;

  console.log("Showing loading page:");
  ext.tabs.query({active: true, currentWindow: true}, function (arrayOfTabs) {
    var activeTab = arrayOfTabs[0];
    var activeTabId = activeTab.id;
    ext.tabs.update(activeTabId, {url: ext.extension.getURL('loading.html')});

    console.log("Showing .Eth page:");
    ext.tabs.query({active: true, currentWindow: true}, function (arrayOfTabs) {
      var activeTab = arrayOfTabs[0];
      var activeTabId = activeTab.id;
      ext.tabs.update(activeTabId, {url: ext.extension.getURL('loading.html')});
      ext.tabs.update(activeTabId, {url: fullUrl}); // #' + domainString + '.' + tld)});
    });
  });

  return {cancel: true};
}

function showIndexWithDomain(domainString) {
  ext.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
    var activeTab = arrayOfTabs[0];
    var activeTabId = activeTab.id;
    ext.tabs.update(activeTabId, {url: ext.extension.getURL('loading.html')});
    console.log("Show index for ", domainString);
  });
}

chrome.browserAction.setPopup({
  popup: "popup.html"
});

ext.runtime.onInstalled.addListener(function(details) {
    if(details.reason == "install"){
      chrome.tabs.create({ url: ext.extension.getURL('index.html?welcome') });
    } else if(details.reason == "update"){
        var thisVersion = chrome.runtime.getManifest().version;
    }
});
