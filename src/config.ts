import {env} from "./env";

// derive the theme name from the build environment
export const THEME_NAME = env.THEME as string;

export default {
  ...env,
  extension: {
    name: `${THEME_NAME === "upio" ? "UP.io" : "Unstoppable Domains"}${env.NODE_ENV === "staging" ? " (staging)" : ""}`,
    uuid:
      THEME_NAME === "upio"
        ? env.NODE_ENV === "staging"
          ? "54704de2-26ab-4e6a-a386-88ceabeb77cd"
          : "58b76146-0f32-41cd-8a91-5343a3e3872f"
        : env.NODE_ENV === "staging"
          ? "21ad664d-7094-493b-9590-c8294d2184dc"
          : "8aee37d6-523f-4b49-b9f3-2fcde7dd5431",
    rdns:
      THEME_NAME === "upio"
        ? env.NODE_ENV === "staging"
          ? "com.unstoppabledomains.upIoStaging"
          : "com.unstoppabledomains.upIo"
        : env.NODE_ENV === "staging"
          ? "com.unstoppabledomains.liteWalletStaging"
          : "com.unstoppabledomains.liteWallet",
  },
};

// the EIP-1193 window property name to inject into DOM
export type WINDOW_PROPERTY_TYPE =
  | "upio"
  | "upioStaging"
  | "unstoppable"
  | "unstoppableStaging";
export const WINDOW_PROPERTY_NAME: WINDOW_PROPERTY_TYPE =
  THEME_NAME === "upio"
    ? env.NODE_ENV === "staging"
      ? "upioStaging"
      : "upio"
    : env.NODE_ENV === "staging"
      ? "unstoppableStaging"
      : "unstoppable";

// derived from icons/96.png, the recommended size for wallet icons
export const LOGO_BASE_64 =
  THEME_NAME === "upio"
    ? "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"
    : "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";
