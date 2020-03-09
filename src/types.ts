
export enum ExtensionOptions {
  CloudflareCDN="Cloudflare CDN",
  InfuraAPI = "Infura API",
  IPFSNetwork = "Directly from IPFS network",
  Pinata = "Pinata",
  Local="Enter your own gateway"
}

export interface ExtensionOptionMessage {
  [key: string]: string
};

export interface ExtensionURIMap {
  [key: string]: string
};

export const ExtensionLabel: ExtensionOptionMessage = {
  [ExtensionOptions.CloudflareCDN] : "Non-paranoid + fast response times",
  [ExtensionOptions.InfuraAPI] : "Non-paranoid + fast response times",
  [ExtensionOptions.IPFSNetwork]: "Paranoid + slow response times",
  [ExtensionOptions.Pinata]: "Non-paranoid + fast response times",
  [ExtensionOptions.Local]: "Unknown + unknown response times "
};

export const ExtensionURIMap: ExtensionURIMap = {
  [ExtensionOptions.CloudflareCDN]: 'https://cloudflare-ipfs.com/',
  [ExtensionOptions.InfuraAPI]: 'https://ipfs.infura.io/',
  [ExtensionOptions.IPFSNetwork]: 'https://gateway.ipfs.io/',
  [ExtensionOptions.Pinata]: 'https://abbfe6z95qov3d40hf6j30g7auo7afhp.mypinata.cloud/'
};
