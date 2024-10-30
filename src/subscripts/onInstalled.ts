import {Logger} from "../lib/logger";
import {initializeBrowserSettings} from "../lib/resolver/settings";

Logger.log("Background Script Started!");

chrome.runtime.onInstalled.addListener(async () => {
  await initializeBrowserSettings();
  Logger.log("Installed!");
});
