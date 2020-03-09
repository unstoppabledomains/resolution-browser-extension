## Unreleased

## 1.1.3
 * Refactor `isValidDNSHostname` to properly check for valid dns hostnames
 * It now allows resolving of numeric crypto domains such as `123412341234123412341234.crypto`
 * Include pathnames on gateway redirects, e.g `ama.crypto/01_crypto-ama-with-cosmos-22619.html` will resolve properly
 * Fix infura bug for urls that does not end with `/` (`https://community.infura.io/t/ipfs-gateway-directory-url-should-end-with-slash/887`)
 * Remove unused files and modules
 * Clean up build directory and archive.zip file
 * Fixed typo from Cloudlare to Cloudflare 

## 1.1.2
 * Default ipfsgateway is cloudflare now.

## 1.1.1
 * Fixed bug with not resolving domains on install
 * Fixed bug with default gateway on install

## 1.1.0
 * Added eth support
 * Fixed UI
 * Increased quality of unstoppable domains logo

## 1.0.0 - 1.0.4
 * First version of unstoppable extension