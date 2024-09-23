import {config} from "dotenv";
import fs from "fs-extra";

const populateEnv = () => {
  // Copy the environment specific config file
  const envFileName = `.env.${process.env.NODE_ENV}`;
  if (!fs.existsSync(envFileName)) {
    console.error(
      `Error: ${envFileName} file not found. Populate the .env file and try again.`,
    );
    process.exit(1);
  }

  // Copy the environment specific file to the default env
  fs.copySync(envFileName, ".env", {overwrite:true});

  // Validate that .env exists as expected
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
  if (envObject["DEFAULT_CHAIN"]) {
    envObject["DEFAULT_CHAIN"] = parseInt(envObject["DEFAULT_CHAIN"]); 
  }

  // Generate TypeScript code to export the environment variables
  const tsContent = `export const env = ${JSON.stringify(envObject, null, 2)} as const;\n`;

  // Write the content to env.ts
  console.log(`Environment populated from ${envFileName}`)
  fs.writeFileSync("src/env.ts", tsContent);
};

populateEnv();
