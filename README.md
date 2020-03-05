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
