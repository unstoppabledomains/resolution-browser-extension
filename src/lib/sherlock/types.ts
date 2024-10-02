export const AUGMENT_ID_PREFIX = "ud-resolved-";

export interface ResolutionMatch {
  node: ChildNode;
  addressOrName: string;
  searchTerm: string;
}

export interface ResolutionData {
  address: string;
  domain: string;
  avatar?: string;
}
