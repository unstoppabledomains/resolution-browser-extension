#! /usr/bin/env node

const fs = require('fs');
const template = require("./manifest-template.json");
const args = process.argv.slice(2);
const isChrome = args[0] === 'chrome';
const isDevMode = args[1] === 'dev';

const path = './static/manifest.json';

if (isDevMode) {
    template['version_name'] = template['version'] + ' -dev_mode-';
}

if (isChrome) {
    template["content_security_policy"] = "script-src 'self' 'sha256-nHKLQ2A1kK023iXgW+lF4Ly2gHbE2mhlqnDhZBLshPg='; object-src 'self'";
    template["offline_enabled"] = false;
    fs.writeFileSync(path, JSON.stringify(template));
    console.log("Chrome manifest is created");
    return ;
}

// Firefox generation
template['applications'] = {
    "gecko": {"id": "ryan@unstoppabledomains.com"}
};

fs.writeFileSync(path, JSON.stringify(template));
console.log("Firefox manifest is created");
return ;