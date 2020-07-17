import Resolution, { ResolutionError, ResolutionErrorCode } from "@unstoppabledomains/resolution";
import { chromeStorageSyncGet, StorageSyncKey } from "./chromeStorageSync";

export function invert(object) {
  const returnee = {};

  for (const key in object) {
    if (!object.hasOwnProperty(key)) continue;
    returnee[object[key]] = key;
  }
  return returnee;
}
