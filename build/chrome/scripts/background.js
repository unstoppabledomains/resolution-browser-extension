(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";var _ext = require("./utils/ext");var _ext2 = _interopRequireDefault(_ext);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

console.log("Loaded Crypto Browser");

var gateway = "127.0.0.1";
var port = "7878";
var access = "PROXY";
var config = {
  mode: "pac_script",
  pacScript: {
    data: "function FindProxyForURL(url, host) {\n" +
    "  if (dnsDomainIs(host, '.eth'))\n" +
    "    return '" + access + " " + gateway + ":" + port + "';\n" +
    "  return 'DIRECT';\n" +
    "}" } };


chrome.proxy.settings.set({ value: config, scope: 'regular' }, function () {});
console.log('Set gateway: ' + JSON.stringify(config["pacScript"]));

_ext2.default.webRequest.onBeforeRequest.addListener(
loadENSURL,
{ urls: ["*://*.eth/*"], types: ["main_frame"] });


function loadENSURL(requestDetails) {
  console.log("Eth Url Requested: " + requestDetails.url);
  var urlObject = new URL(requestDetails.url);
  var domainString = getDomainStringOnly(urlObject.hostname);
  return;

  redirectToENSDomain(domainString, "eth", requestDetails, urlObject.pathname + urlObject.hash, requestDetails.url); //Setting .eth statically as the tld for now
}

_ext2.default.webRequest.onBeforeRequest.addListener(
respondToGoogleSearch,
{ urls: ["*://www.google.com/search*"], types: ["main_frame"] },
["blocking"] //TODO: Add alternate search engines
);

function respondToGoogleSearch(requestDetails) {
  var query = getQueryVariable(requestDetails.url);
  if (!query || !query.endsWith(".eth") || /\s/g.test(query)) {
    return;
  }

  console.log("Google Search Query: " + query);
  var domainString = getDomainStringOnly(query);
  redirectToENSDomain(domainString, "eth", requestDetails);
}

chrome.tabs.onUpdated.addListener(function (tabId, info) {
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
  _ext2.default.tabs.query({ active: true, currentWindow: true }, function (arrayOfTabs) {
    var activeTab = arrayOfTabs[0];
    var activeTabId = activeTab.id;
    _ext2.default.tabs.update(activeTabId, { url: _ext2.default.extension.getURL('loading.html') });

    console.log("Showing .Eth page:");
    _ext2.default.tabs.query({ active: true, currentWindow: true }, function (arrayOfTabs) {
      var activeTab = arrayOfTabs[0];
      var activeTabId = activeTab.id;
      _ext2.default.tabs.update(activeTabId, { url: _ext2.default.extension.getURL('loading.html') });
      _ext2.default.tabs.update(activeTabId, { url: fullUrl }); // #' + domainString + '.' + tld)});
    });
  });

  return { cancel: true };
}

function showIndexWithDomain(domainString) {
  _ext2.default.tabs.query({ active: true, currentWindow: true }, function (arrayOfTabs) {
    var activeTab = arrayOfTabs[0];
    var activeTabId = activeTab.id;
    _ext2.default.tabs.update(activeTabId, { url: _ext2.default.extension.getURL('loading.html') });
    console.log("Show index for ", domainString);
  });
}

chrome.browserAction.setPopup({
  popup: "popup.html" });


_ext2.default.runtime.onInstalled.addListener(function (details) {
  if (details.reason == "install") {
    chrome.tabs.create({ url: _ext2.default.extension.getURL('index.html?welcome') });
  } else if (details.reason == "update") {
    var thisVersion = chrome.runtime.getManifest().version;
  }
});

},{"./utils/ext":2}],2:[function(require,module,exports){
'use strict';var apis = [
'alarms',
'bookmarks',
'browserAction',
'commands',
'contextMenus',
'cookies',
'downloads',
'events',
'extension',
'extensionTypes',
'history',
'i18n',
'idle',
'notifications',
'pageAction',
'runtime',
'storage',
'tabs',
'webNavigation',
'webRequest',
'windows'];


function Extension() {
  var _this = this;

  apis.forEach(function (api) {

    _this[api] = null;

    try {
      if (chrome[api]) {
        _this[api] = chrome[api];
      }
    } catch (e) {}

    try {
      if (window[api]) {
        _this[api] = window[api];
      }
    } catch (e) {}

    try {
      if (browser[api]) {
        _this[api] = browser[api];
      }
    } catch (e) {}
    try {
      _this.api = browser.extension[api];
    } catch (e) {}
  });

  try {
    if (browser && browser.runtime) {
      this.runtime = browser.runtime;
    }
  } catch (e) {}

  try {
    if (browser && browser.browserAction) {
      this.browserAction = browser.browserAction;
    }
  } catch (e) {}

}

module.exports = new Extension();

},{}]},{},[1])

//# sourceMappingURL=background.js.map
