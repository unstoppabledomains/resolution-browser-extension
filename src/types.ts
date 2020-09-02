
export enum ExtensionOptions {
  InfuraAPI = "Infura API",
  IPFSNetwork = "Directly from IPFS network",
  Local="Enter your own gateway"
}

export interface ExtensionOptionMessage {
  [key: string]: string
};

export interface ExtensionURIMap {
  [key: string]: string
};

export const ExtensionLabel: ExtensionOptionMessage = {
  [ExtensionOptions.InfuraAPI] : "Non-paranoid + fast response times",
  [ExtensionOptions.IPFSNetwork]: "Paranoid + slow response times",
  [ExtensionOptions.Local]: "Unknown + unknown response times "
};

export const ExtensionURIMap: ExtensionURIMap = {
  [ExtensionOptions.InfuraAPI]: 'ipfs.infura-ipfs.io',
  [ExtensionOptions.IPFSNetwork]: 'ipfs.dweb.link',
};
