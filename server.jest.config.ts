import type {InitialOptionsTsJest} from "ts-jest/dist/types";

const config: InitialOptionsTsJest = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["<rootDir>/tests/setupTests.ts"],
  setupFilesAfterEnv: ["jest-extended/all"],
  testMatch: ["<rootDir>/**/?(*.)+(spec|test).[jt]s"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
        isolatedModules: false,
      },
    ],
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/releases/"],
};

export default config;
