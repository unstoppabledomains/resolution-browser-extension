#! /usr/bin/env node

const fs = require('fs');
const template = require("./manifest-template.json");
const args = process.argv.slice(2);
const isChrome = args[0] == 'chrome';

const path = './static/manifest.json';

if (isChrome) {
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