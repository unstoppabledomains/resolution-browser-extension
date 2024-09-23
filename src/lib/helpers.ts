import {ExtensionOptions, ExtensionURIMap} from "../types/redirect";
import {
  StorageSyncKey,
  chromeStorageGet,
  chromeStorageSet,
} from "./chromeStorage";

export const supportedDomains: string[] = [
  ".crypto",
  ".nft",
  ".wallet",
  ".bitcoin",
  ".x",
  ".888",
  ".dao",
  ".blockchain",
  ".zil",
  ".hi",
  ".klever",
  ".kresus",
  ".clay",
  ".polygon",
  ".anime",
  ".manga",
  ".binanceus",
  ".go",
  ".altimist",
  ".pudgy",
  ".austin",
  ".unstoppable",
  ".bitget",
  ".pog",
  ".witg",
  ".metropolis",
  ".wrkx",
  ".secret",
  ".raiin",
  ".stepn",
  ".kryptic",
  ".ubu",
  ".tball",
  ".farms",
  ".dfz",
  ".smobler",
  ".lfg",
  ".dream",
];

//return true if url ends in one of the supported domains
export const supportedDomain = (q: string): boolean =>
  supportedDomains.some((d: string): boolean => q.endsWith(d));

export const uniqueArray = (a: any[]): any[] => {
  function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  }
  var unique = a.filter(onlyUnique);

  return unique;
};

export const initializeBrowserSettings = async () => {
  // set base URL option if missing
  const baseUrl = await chromeStorageGet(StorageSyncKey.GatewayBaseURL);
  if (!baseUrl) {
    await chromeStorageSet(
      StorageSyncKey.GatewayBaseURL,
      ExtensionURIMap[ExtensionOptions.InfuraAPI],
    );
  }

  // set gateway option if missing
  const gateway = await chromeStorageGet(StorageSyncKey.GatewayOption);
  if (!gateway) {
    await chromeStorageSet(
      StorageSyncKey.GatewayOption,
      ExtensionOptions.InfuraAPI,
    );
  }
};
