
export enum ExtensionOptions {
  InfuraAPI = "Infura API",
  IPFSNetwork = "Directly from IPFS network",
  CFIPFS = "CF ipfs",
  COSMOSING = "cosmos-ink.net",
  TWO_READ = "2read.net",
  JACL = "jacl.tech",
  Local="Enter your own gateway",
};

export interface ExtensionOptionMessage {
  [key: string]: string
};

export interface ExtensionURIMap {
  [key: string]: string
};

export const ExtensionLabel: ExtensionOptionMessage = {
  [ExtensionOptions.InfuraAPI] : "Non-paranoid + fast response times",
  [ExtensionOptions.IPFSNetwork]: "Paranoid + fast response times",
  [ExtensionOptions.CFIPFS]: "Paranoid + slow response times",
  [ExtensionOptions.COSMOSING]: "Paranoid + slow response times",
  [ExtensionOptions.TWO_READ]: "Paranoid + slow response times",
  [ExtensionOptions.JACL]: "Paranoid + slow response times",
  [ExtensionOptions.Local]: "Unknown + unknown response times "
};

export const ExtensionURIMap: ExtensionURIMap = {
  [ExtensionOptions.InfuraAPI]: 'ipfs.infura-ipfs.io',
  [ExtensionOptions.IPFSNetwork]: 'ipfs.dweb.link',
  [ExtensionOptions.CFIPFS]: 'ipfs.cf-ipfs.com',
  [ExtensionOptions.COSMOSING]: 'ipfs.cosmos-ink.net',
  [ExtensionOptions.TWO_READ]: 'ipfs.2read.net',
  [ExtensionOptions.JACL]: 'ipfs.jacl.tech'
};
