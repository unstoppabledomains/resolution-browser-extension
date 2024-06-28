import {config} from "dotenv";
import fs from "fs-extra";

const populateEnv = () => {
  // Check if .env file exists
  if (!fs.existsSync(".env")) {
    console.error(
      "Error: .env file not found. Populate the .env file and try again.",
    );
    process.exit(1);
  }

  // Load environment variables from .env file
  const result = config();
  if (result.error) {
    console.error(`Error loading .env file: ${result.error}`);
    process.exit(1);
  }

  const envObject = Object.keys(result.parsed).reduce((acc, key) => {
    acc[key] = result.parsed[key];
    return acc;
  }, {});

  // Generate TypeScript code to export the environment variables
  const tsContent = `export const env = ${JSON.stringify(envObject, null, 2)} as const;\n`;

  // Write the content to env.ts
  fs.writeFileSync("src/env.ts", tsContent);
};

populateEnv();
