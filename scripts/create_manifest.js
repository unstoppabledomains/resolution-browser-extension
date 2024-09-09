#! /usr/bin/env node

const fs = require("fs");
const templateJson = require("../manifest-template.json");
const packageJson = require("../package.json");
const args = process.argv.slice(2);
const isChrome = args[0] === "chrome";
const isFirefox = args[0] === "firefox";
const isDevMode = args[1] === "dev";

const path = "./src/manifest.json";

// inject version from package.json
templateJson["version"] = packageJson["version"];

// inject development mode flags
if (isDevMode) {
  templateJson["version_name"] = templateJson["version"] + " -dev_mode-";
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
