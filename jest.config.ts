import type {InitialOptionsTsJest} from "ts-jest/dist/types";

const config: InitialOptionsTsJest = {
  projects: [
    "<rootDir>/client.jest.config.ts",
    "<rootDir>/server.jest.config.ts",
  ],
  coverageProvider: "v8",
  collectCoverageFrom: [
    "**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/*.config.*",
    "!**/*.test.*",
    "!**/.*",
    "!**/.next/**",
    "!**/build/**",
    "!**/coverage/**",
    "!**/csp/**",
    "!**/node_modules/**",
    "!**/styles/**",
    "!**/tests/**",
  ],
  coveragePathIgnorePatterns: [
    "**/tests/",
    "**/styles/",
    "**/public/",
    "**/static/",
    "**/build/",
    "**/dist/",
    "**/node_modules/",
    "**/csp/",
    "package.json",
  ],
  testTimeout: 60000,
  reporters: ["default", "github-actions"],
  verbose: true,
};

export default config;
