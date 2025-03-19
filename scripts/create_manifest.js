#! /usr/bin/env node

const fs = require("fs");
const manifestTemplateJson = require("../manifest-template.json");
const packageJson = require("../package.json");

const args = process.argv.slice(2);
const isChrome = args[0] === "chrome";
const envName = process.env.NODE_ENV || "production";

// read the index template
let indexTemplateHtml = fs.readFileSync("./src/index.template.html", "utf8");

// destination paths
const manifestPath = "./src/manifest.json";
const indexPath = "./src/index.html";

// inject version from package.json
manifestTemplateJson["version"] = packageJson["version"];
if (envName !== "production") {
  manifestTemplateJson["version_name"] = `${packageJson["version"]}-${envName.toLowerCase()}`;
}

// normalize the template and inject theme data
const theme = process.env.THEME ? process.env.THEME : "udme";
let manifestTemplateStr = JSON.stringify(manifestTemplateJson);
manifestTemplateStr = manifestTemplateStr.replace(/<theme>/g, theme);

// replace other theme variables
switch (theme) {
  case "udme":
    manifestTemplateStr = manifestTemplateStr.replace(/<name>/g, "Unstoppable Domains");
    manifestTemplateStr = manifestTemplateStr.replace(/<short_name>/g, "Unstoppable Domains");
    manifestTemplateStr = manifestTemplateStr.replace(/<website>/g, "unstoppabledomains.com");
    manifestTemplateStr = manifestTemplateStr.replace(/<description>/g, "A crypto wallet for domainers: easily interact with onchain identities, assets and apps.");
    break;
  case "upio":
    manifestTemplateStr = manifestTemplateStr.replace(/<name>/g, "UP.io – Watch your crypto grow up");
    manifestTemplateStr = manifestTemplateStr.replace(/<short_name>/g, "UP.io");
    manifestTemplateStr = manifestTemplateStr.replace(/<website>/g, "up.io");
    manifestTemplateStr = manifestTemplateStr.replace(/<description>/g, "Securely manage your digital assets with confidence and ease. Swap and trade tokens on Bitcoin, Ethereum, Solana, Base & Polygon.");
    indexTemplateHtml = indexTemplateHtml.replace(/Unstoppable Domains/g, "UP.io");
    break;
}

if (isChrome) {
  manifestTemplateJson["offline_enabled"] = false;
  fs.writeFileSync(manifestPath, manifestTemplateStr);
  fs.writeFileSync(indexPath, indexTemplateHtml);
  console.log("Chrome manifest is created");
  return;
}

// No browser specific generation requested
fs.writeFileSync(manifestPath, manifestTemplateStr);
fs.writeFileSync(indexPath, indexTemplateHtml);
console.log("Generic manifest is created");
return;
