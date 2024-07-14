import QueryString from "qs";
import config from "../config";
import {
  AddressResolution,
  DomainFieldTypes,
  SerializedDomainListData,
  SerializedPublicDomainProfileData,
} from "../types";
import fetchProfileApi from "./fetchProfileApi";

export const isEthAddress = (address: string): boolean =>
  /^0x[a-fA-F0-9]{40}$/.test(address);

export const getAddressMetadata = async (
  addressOrDomain: string,
): Promise<AddressResolution | undefined> => {
  // determine the reverse address to query
  const sanitizedValue = addressOrDomain.replace("eip155:", "").toLowerCase();

  // attempt resolution
  try {
    // retrieve the reverse resolution details
    const resolution = await getProfileReverseResolution(sanitizedValue);
    if (resolution?.address) {
      return resolution;
    }
  } catch (e) {}

  // return the address metadata
  if (isEthAddress(sanitizedValue)) {
    return {
      address: sanitizedValue,
    };
  }
  return;
};

export const getProfileData = async (
  domain: string,
  fields: DomainFieldTypes[],
  expiry?: number,
): Promise<SerializedPublicDomainProfileData | undefined> => {
  const url = `${config.PROFILE_API_URL}public/${domain}?${QueryString.stringify(
    {
      expiry,
      fields: fields ? fields.join(",") : undefined,
    },
    {encode: false},
  )}`;

  const data = await fetchProfileApi(url);
  return data;
};

export const DOMAIN_LIST_PAGE_SIZE = 8;

export const getOwnerDomains = async (
  address: string,
  cursor?: string,
  strict?: boolean,
  forceRefresh?: boolean,
): Promise<SerializedDomainListData | undefined> => {
  const url = `${config.PROFILE_API_URL}/user/${address.toLowerCase()}/domains?${QueryString.stringify(
    {
      take: DOMAIN_LIST_PAGE_SIZE,
      strict,
      cursor,
      forceRefresh: forceRefresh ? Date.now() : undefined,
    },
    {skipNulls: true},
  )}`;

  const data = await fetchProfileApi<SerializedDomainListData>(url);
  return data;
};

export const getProfileReverseResolution = async (
  address: string,
): Promise<AddressResolution | undefined> => {
  // return defined reverse resolution name if available
  const url = `${config.PROFILE_API_URL}/resolve/${address}`;

  const reverseResolution = await fetchProfileApi<any>(url);

  if (reverseResolution?.name) {
    return reverseResolution;
  }

  // return first owner domain as a fallback
  const ownerDomains = await getOwnerDomains(address, undefined, true);
  if (ownerDomains?.data && ownerDomains.data.length > 0) {
    return {
      address,
      name: ownerDomains.data[0].domain,
    };
  }

  // return undefined if no domains available
  return undefined;
};
