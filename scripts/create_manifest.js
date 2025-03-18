#! /usr/bin/env node

const fs = require("fs");
const templateJson = require("../manifest-template.json");
const packageJson = require("../package.json");
const args = process.argv.slice(2);
const isChrome = args[0] === "chrome";
const envName = process.env.NODE_ENV || "production";

const path = "./src/manifest.json";

// inject version from package.json
templateJson["version"] = packageJson["version"];
if (envName !== "production") {
  templateJson["version_name"] = `${packageJson["version"]}-${envName.toLowerCase()}`;
}

// normalize the template and inject theme data
const theme = process.env.THEME ? process.env.THEME : "udme";
let templateStr = JSON.stringify(templateJson);
templateStr = templateStr.replace(/<theme>/g, theme);

// replace other theme variables
switch (theme) {
  case "udme":
    templateStr = templateStr.replace(/<name>/g, "Unstoppable Domains");
    templateStr = templateStr.replace(/<short_name>/g, "Unstoppable Domains");
    templateStr = templateStr.replace(/<website>/g, "unstoppabledomains.com");
    templateStr = templateStr.replace(/<description>/g, "A crypto wallet for domainers: easily interact with onchain identities, assets and apps.");
    break;
  case "upio":
    templateStr = templateStr.replace(/<name>/g, "UP.io - watch your crypto grow up");
    templateStr = templateStr.replace(/<short_name>/g, "UP.io");
    templateStr = templateStr.replace(/<website>/g, "up.io");
    templateStr = templateStr.replace(/<description>/g, "Manage your digital assets with confidence while enjoying a user-friendly experience. Supports Bitcoin, Solana, Ethereum, Base and Polygon.");
    break;
}

if (isChrome) {
  templateJson["offline_enabled"] = false;
  fs.writeFileSync(path, templateStr);
  console.log("Chrome manifest is created");
  return;
}

// No browser specific generation requested
fs.writeFileSync(path, templateStr);
console.log("Generic manifest is created");
return;
