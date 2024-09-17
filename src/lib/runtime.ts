import {Logger} from "./logger";

export const getManifestVersion = () => {
  try {
    return chrome.runtime.getManifest().version;
  } catch (e) {
    Logger.warn("unable to determine version", e);
  }
  return undefined;
};
