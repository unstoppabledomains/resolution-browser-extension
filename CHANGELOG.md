## 2.3.0
* Add .hi TLD
## 2.2.3
* Removed ens support
* Updated resolution library to 7.0.0
## 2.2.2
* Fixed issue with resolving .888 domains on Windows OS
## 2.2.1
* Fixed issue with long domain names. Now extension can resolve any length domain without a problem.

## 2.2.0
* Added support for L2 domains on polygon

## 2.1.1
* Fix issue with not capturing .888 domains

## 2.1.0
* Allowed new UNS tld to be parsed (.x, .888, .wallet, .coin, .nft, .dao, .bitcoin, .blockchain)

## 2.0.5
* Fixed a bug causing to load all websites instead of paginated version when misclicked the per page settings

## 2.0.4
* Fixed redirect to traditional domain when ipfs record is not found

## 2.0.3
* Added 4 more options for safe origin gateway
* Website List now shows temporary disabled if couldn't fetch the websites from api.

## 2.0.2
* Fixed bug when old localstorage was present on updates. Now we clear the storage on install and update the localstorage to default values.

## 2.0.1
* Fixed issue with fresh install

## 2.0.0
* Depricated unsecured gateway options

## 1.4.0
* Updated the search engine redirection system
* Added support of duckduckgo.com, yandex.ru, qwant.com, mojeek.com, aol.co.uk, baidu.com, bing.com, yahoo.com, wiki.com
* Upgraded internal scripts to build both Firefox and Chrome versions simultaniously 

## 1.3.7
* use redirect_url if ipfs hash is not set.

## 1.3.6
* Added support for domains that starts or ends with -

## 1.3.5
* Redirected to unstoppabledomains.com when domain doesn't have an ipfs record

## 1.3.4
* Moved the position of 0-9 selector on website lists to be first according to ASCII standart

## 1.3.3
* Add the ability to see domains which starts from 0-9 or a hyphen 

## 1.3.2
* Remove .kred .luxe .xyz since they have a DNS support

## 1.3.1
* Upgraded resolution lib to 1.3.6
* Allowed .kred .luxe and .xyz look up as part of ens domains

## 1.3.0
* Removed caching of ipfs hashes

## 1.2.3
* Featured websites list
* Simple caching of ipfs hashes

## 1.2.2
* Responsive design
* Fixed bug causing people to stay on loading page whenever they went back in history

## 1.2.0 - 1.2.1
 * Redesign of weblist catalogue
 * New colors
 * Bookmark feature

## 1.1.2
 * Refactor `isValidDNSHostname` to properly check for valid dns hostnames
 * It now allows resolving of numeric crypto domains such as `123412341234123412341234.crypto`
 * Include pathnames on gateway redirects, e.g `ama.crypto/01_crypto-ama-with-cosmos-22619.html` will resolve properly
 * Fix infura bug for urls that does not end with `/` (`https://community.infura.io/t/ipfs-gateway-directory-url-should-end-with-slash/887`)
 * Remove unused files and modules
 * Clean up build directory and archive.zip file
 * Fixed typo from Cloudlare to Cloudflare 
 * Shorten the display name to Unstoppable Extension

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
