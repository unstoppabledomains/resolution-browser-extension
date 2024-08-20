export enum ExtensionOptions {
  InfuraAPI = "Infura API",
  IPFSNetwork = "Directly from IPFS network",
  CFIPFS = "CF ipfs",
}

export interface ExtensionOptionMessage {
  [key: string]: string;
}

export interface ExtensionURIMap {
  [key: string]: string;
}

export const ExtensionLabel: ExtensionOptionMessage = {
  [ExtensionOptions.InfuraAPI]: "Non-paranoid + fast response times",
  [ExtensionOptions.IPFSNetwork]: "Paranoid + fast response times",
  [ExtensionOptions.CFIPFS]: "Paranoid + slow response times",
};

export const ExtensionURIMap: ExtensionURIMap = {
  [ExtensionOptions.CFIPFS]: "https://{ipfs}.ipfs.cf-ipfs.com",
  [ExtensionOptions.InfuraAPI]: "https://{ipfs}.ipfs.infura-ipfs.io",
  [ExtensionOptions.IPFSNetwork]: "https://{ipfs}.ipfs.dweb.link",
};
