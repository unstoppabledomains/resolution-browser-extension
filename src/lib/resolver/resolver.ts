import config from "@unstoppabledomains/config";
import {RESOLUTION_URL} from "./types";
import {Logger} from "../logger";
import {ResolutionData} from "../sherlock/types";
import {LRUCache} from "lru-cache";
import {isEthAddress} from "../sherlock/matcher";

// temporary cache to hold supported TLDs
const tldCacheKey = "supportedTlds";
const tldCache = new LRUCache<string, any>({
  max: 50,
  ttl: 60 * 1000 * 30, // 30 minutes
});

// getSupportedTlds retrieves all non-ICANN domains supported by Unstoppable Domains
export const getSupportedTlds = async (): Promise<string[]> => {
  // retrieve from cache if available
  const cachedValue = tldCache.get(tldCacheKey);
  if (cachedValue && Array.isArray(cachedValue)) {
    return cachedValue;
  }

  // retrieve ICANN supported TLDs
  const icannTlds = await getIcannTlds();
  if (!icannTlds || icannTlds.size === 0) {
    // cannot continue if the ICANN domains were not found
    Logger.warn("ICANN domains not found");
    return [];
  }

  // retrieve all supported TLDs
  try {
    const resolutionResponse = await fetch(`${RESOLUTION_URL}/supported_tlds`);
    if (resolutionResponse.ok) {
      const resolutionData = await resolutionResponse.json();
      const tlds = resolutionData?.tlds;
      if (tlds && Array.isArray(tlds)) {
        // filter to only non-ICANN names
        const supportedTlds = tlds
          .map((d) => d.toLowerCase())
          .filter((d) => !icannTlds.has(d));

        // cache and return
        tldCache.set(tldCacheKey, supportedTlds);
        return supportedTlds;
      }
    }
  } catch (e) {
    Logger.warn("Error retrieving supported domains", e);
  }
  return [];
};

export const isSupportedDomain = async (domain: string): Promise<boolean> => {
  const splitDomain = domain?.split(".");
  if (!splitDomain) {
    return false;
  }

  if (splitDomain.length > 1) {
    // get supported TLD list
    const supportedTlds = await getSupportedTlds();
    for (const tld of supportedTlds) {
      if (domain.toLowerCase().endsWith(`.${tld}`)) {
        return true;
      }
    }
  }

  return false;
};

// getIcannTlds retrieves list of all known ICANN domains
export const getIcannTlds = async (): Promise<Set<string>> => {
  try {
    const icannResponse = await fetch(
      `https://data.iana.org/TLD/tlds-alpha-by-domain.txt`,
    );
    if (icannResponse.ok) {
      const icannData = await icannResponse.text();
      const tlds = icannData.split(/\n/);
      if (tlds.length > 1) {
        return new Set(tlds.slice(1).map((d) => d.toLowerCase()));
      }
    }
  } catch (e) {
    Logger.warn("Error retrieving ICANN domains", e);
  }

  return new Set<string>();
};

// getResolution retrieves resolution data from an address or name
export const getResolution = async (
  addressOrName: string,
): Promise<ResolutionData | undefined> => {
  // validate the name format
  const isValidDomain = await isSupportedDomain(addressOrName);
  if (!isEthAddress(addressOrName) && !isValidDomain) {
    return undefined;
  }

  // get from cache
  const cachedValue = tldCache.get(addressOrName.toLowerCase());
  if (cachedValue?.address && cachedValue?.domain) {
    return isEthAddress(cachedValue.address) ? cachedValue : undefined;
  }

  // resolve the name
  const resolutionResponse = await fetch(
    `${config.PROFILE.HOST_URL}/resolve/${addressOrName}?resolutionOrder=ud,ens`,
  );
  if (resolutionResponse.ok) {
    const resolutionData = await resolutionResponse.json();
    if (resolutionData) {
      const returnData = {
        domain: resolutionData.name,
        address: resolutionData.address,
      };
      tldCache.set(addressOrName.toLowerCase(), returnData);
      return returnData;
    }
  }

  // cache negative response to prevent retry
  tldCache.set(addressOrName.toLowerCase(), {
    address: "empty",
    domain: "empty",
  });
  return undefined;
};
