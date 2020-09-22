
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
  [ExtensionOptions.CFIPFS]: 'https://{ipfs}.ipfs.cf-ipfs.com',
  [ExtensionOptions.COSMOSING]: 'https://{ipfs}.ipfs.cosmos-ink.net',
  [ExtensionOptions.TWO_READ]: 'https://{ipfs}.ipfs.2read.net',
  [ExtensionOptions.JACL]: 'https://{ipfs}.ipfs.jacl.tech',
  [ExtensionOptions.InfuraAPI]: 'https://{ipfs}.ipfs.infura-ipfs.io',
  [ExtensionOptions.IPFSNetwork]: 'https://{ipfs}.ipfs.dweb.link',
};
