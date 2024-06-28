#! /usr/bin/env node

const fs = require("fs");
const template = require("./manifest-template.json");
const args = process.argv.slice(2);
const isChrome = args[0] === "chrome";
const isFirefox = args[0] === "firefox";
const isDevMode = args[1] === "dev";

const path = "./src/manifest.json";

if (isDevMode) {
  template["version_name"] = template["version"] + " -dev_mode-";
}

if (isChrome) {
  template["content_security_policy"] = {
    extension_pages: "script-src 'self'; object-src 'self'",
  };
  template["offline_enabled"] = false;
  fs.writeFileSync(path, JSON.stringify(template));
  console.log("Chrome manifest is created");
  return;
}

if (isFirefox) {
  // Firefox generation
  template["applications"] = {
    gecko: {id: "ryan@unstoppabledomains.com"},
  };
}

fs.writeFileSync(path, JSON.stringify(template));
console.log("Manifest is created");
return;
