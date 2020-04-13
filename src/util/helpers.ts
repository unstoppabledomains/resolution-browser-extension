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

export async function redirectToIpfs(domain: string) {
  const resolution = new Resolution({
    blockchain: {
      ens: {
        url: 'https://mainnet.infura.io/v3/350101a50e4c4319bcafc44313daf5dc'
      },
      cns: {
        url: 'https://mainnet.infura.io/v3/350101a50e4c4319bcafc44313daf5dc'
      }
    }
  });
  const gatewayBaseURL = new URL(
    (await chromeStorageSyncGet(StorageSyncKey.GatewayBaseURL)) || 'http://gateway.ipfs.io'
  ).href;
  try {
    const url = new URL(domain);
    const ipfsHash = await resolution.ipfsHash(url.hostname);
    const displayUrl = `${gatewayBaseURL}ipfs/${ipfsHash}${url.pathname}`;
    chrome.tabs.update({
      url: displayUrl
    });
  } catch (err) {
    let message = err.message;
    if (err instanceof ResolutionError) {
      if (err.code === ResolutionErrorCode.RecordNotFound) message = 'Ipfs page not found';
    }
    chrome.tabs.update({ url: `index.html#error?reason=${message}` });
  }
}