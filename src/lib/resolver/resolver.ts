import config from "@unstoppabledomains/config";
import {RESOLUTION_URL} from "./types";
import {Logger} from "../logger";

// getSupportedTlds retrieves all non-ICANN domains supported by Unstoppable Domains
export const getSupportedTlds = async (): Promise<string[]> => {
  // retrieve ICANN supported TLDs
  const icannTlds = await getIcannTlds();
  if (!icannTlds || icannTlds.length === 0) {
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
        return tlds
          .map((d) => d.toLowerCase().replace(".", ""))
          .filter((d) => !icannTlds.includes(d));
      }
    }
  } catch (e) {
    Logger.warn("Error retrieving supported domains", e);
  }
  return [];
};

// getIcannTlds retrieves list of all known ICANN domains
export const getIcannTlds = async (): Promise<string[]> => {
  try {
    const icannResponse = await fetch(
      `https://data.iana.org/TLD/tlds-alpha-by-domain.txt`,
    );
    if (icannResponse.ok) {
      const icannData = await icannResponse.text();
      const tlds = icannData.split(/\n/);
      if (tlds.length > 1) {
        return tlds.slice(1).map((d) => d.toLowerCase());
      }
    }
  } catch (e) {
    Logger.warn("Error retrieving ICANN domains", e);
  }

  return [];
};

// getReverseResolution retrieves primary domain for an address if it exists
export const getReverseResolution = async (
  address: string,
): Promise<string | undefined> => {
  const resolutionResponse = await fetch(
    `${config.PROFILE.HOST_URL}/resolve/${address}?resolutionOrder=ud,ens`,
  );
  if (resolutionResponse.ok) {
    const resolutionData = await resolutionResponse.json();
    return resolutionData?.name;
  }
  return undefined;
};
