import ext from "./utils/ext";
import storage from "./utils/storage";

var popup = document.getElementById("app");

ext.tabs.query({active: true, currentWindow: true}, function(tabs) {
  var activeTab = tabs[0];
  chrome.tabs.sendMessage(activeTab.id, { action: 'process-page' }, renderGreeting);
});

var renderGreeting = () => {
  var displayContainer = document.getElementById("display-container");
  displayContainer.innerHTML = `<p class='message'>Enter a Crypto url in the search bar to view it</p>`;
}

