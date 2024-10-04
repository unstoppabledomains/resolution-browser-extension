export const SHERLOCK_ICON = "🔍";
export const UD_STYLE_ID = "ud-styles";
export const UD_PLACEHOLDER_ID = "ud-popup-placeholder";
export const BASE_Z_INDEX = 10000;
export const TOOLTIP_WIDTH = 330;

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
