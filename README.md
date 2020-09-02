# The Unstoppable Extension

The Unstoppable Extension is used to access decentralized blockchain domains. These domains are stored on the blockchain and hosted on decentralized storage networks like IPFS. This extension resolves these names inside chrome by redirecting queries to IPFS gateways. This technology allows users to surf the decentralized web and visit ipfs websites hosted on .crypto, .zil, .eth 

## Getting started
 * First of all clone the repo and install all dependencies with yarn or npm install
 
 * ```yarn build``` to build the project
 
 * Once the project is build type ```chrome://extensions``` into a chrome browser to maintain the extensions. Load an unpacked version of this extension into the browser (choose folder build that was generated after the build command) 


## Usage
 * Choose a gateway from extension pop up window.
 * Type in a blockchain domain in the browser url field.
 * You will be redirected to the IPFS gateway with the domain’s IPFS hash record. 

## FAQ

### Why does this extension require access to *.google.com and others search engines' domains?

Without doing so, we couldn't easily redirect people who use [Google](https://digg.com/video/tech-ceos-testified-before-congress-and-things-got-awkward).

For example, if the user searches for "brad.crypto", this extension will redirect your browser to the decentralised address.

Please note that this extension *does not* upload any form of browsing history to our servers. This calculation is done completely in the client.

### How can I add support for a different search engine

It is easy. Three steps is required
 * Update static/manifest.json file with permissions to catch request from the search engine
 * Update util/searchEngines.ts with information about search engine
 * Test it

After all of those steps just make a PR and we will add the support as soon as possible

### Building the extension

The extension uses [Parcel](https://parceljs.org/) to pack the extension. After cloning the repo, running `yarn build` will build the extension, and you can load the `build` folder into Chrome.

Currently, the package requires Node **version 10** to build. If you're using a newer version, please use [NVM](https://github.com/nvm-sh/nvm) to install NodeJS version 10.22.0, switch to it, and try building again.
