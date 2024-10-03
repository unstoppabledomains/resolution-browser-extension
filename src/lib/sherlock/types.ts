export const SHERLOCK_ICON = "🔍";
export const UD_STYLE_ID = "ud-styles";
export const BASE_Z_INDEX = 10000;
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
