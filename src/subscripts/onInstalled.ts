import {initializeBrowserSettings} from "../lib/helpers";
import {Logger} from "../lib/logger";

Logger.log("Background Script Started!");

chrome.runtime.onInstalled.addListener(async () => {
  await initializeBrowserSettings();
  Logger.log("Installed!");
});
