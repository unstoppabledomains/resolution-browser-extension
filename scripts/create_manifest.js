#! /usr/bin/env node

const fs = require("fs");
const templateJson = require("../manifest-template.json");
const packageJson = require("../package.json");
const args = process.argv.slice(2);
const isChrome = args[0] === "chrome";
const isFirefox = args[0] === "firefox";
const envName = process.env.NODE_ENV || "production";

const path = "./src/manifest.json";

// inject version from package.json
templateJson["version"] = packageJson["version"];
if (envName !== "production") {
  templateJson["version_name"] = `${packageJson["version"]}-${envName.toLowerCase()}`;
}

if (isChrome) {
  templateJson["offline_enabled"] = false;
  fs.writeFileSync(path, JSON.stringify(templateJson));
  console.log("Chrome manifest is created");
  return;
}

if (isFirefox) {
  // Firefox generation
  templateJson["applications"] = {
    gecko: {id: "ryan@unstoppabledomains.com"},
  };
  fs.writeFileSync(path, JSON.stringify(templateJson));
  console.log("Firefox manifest is created");
  return;
}

// No browser specific generation requested
fs.writeFileSync(path, JSON.stringify(templateJson));
console.log("Generic manifest is created");
return;
