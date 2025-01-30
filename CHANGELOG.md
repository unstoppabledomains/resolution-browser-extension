## 3.1.50
* Automatically update balance changes
* Add share wallet button
* Move optional permissions CTAs into settings panel

## 3.1.49
* Introduce session lock feature to enhance security
* Settings panel styling updates
* Security center styling updates

## 3.1.48
* Minor UX improvements

## 3.1.47
* Performance optimization
* Light mode / dark mode support
* Solana transaction history
* Bug fixes

## 3.1.46
* Add Ethereum RPC methods: eth_getBalance, eth_getCode, eth_gasPrice

## 3.1.45
* Bug fixes

## 3.1.44
* Enable Solana wallet provider in the browser

## 3.1.43
* Support Solana browser extension provider methods
* Enable Solana SPL token management

## 3.1.42
* Update transaction validation logic
* Update connect confirmation with transfer details

## 3.1.41
* Fix app connection bug

## 3.1.40
* Cross chain token swap support
* Performance improvements
* User experience improvements

## 3.1.38
* Support for ERC-20 token management
* Support additional RPC methods to enable Uniswap transactions
* Support for service worker background signing
* Remove clutter from drop down menu
* Fix bug validating token decimals before transfer
* Modify activity panel color palette

## 3.1.37
* Enroll 2FA from settings menu

## 3.1.36
* Fix bug when listing NFT tokens
* Improve UX for popup windows

## 3.1.35
* Fix bug related to validation failures during asset selection
* Fix bug displaying gas symbol in transaction list
* Do not show domain NFTs in token list

## 3.1.34
* Sherlock Assistant magnifying glass
* Add configuration panel for Sherlock in non-wallet mode
* Optimize performance

## 3.1.33
* Enhancements to Sherlock domain detection

## 3.1.31
* Update XMTP version to 12.1.0
* Enhanced message spam protections
* Open messages in browser side panel
* Messages context menu

## 3.1.28
* Reduce the set of required extension permissions
* Make permissions optional where possible

## 3.1.25
* Support for Unstoppable Lite Wallet, a wallet for domainers
* Support for Unstoppable Messaging, powered by XMTP
* Support for Sherlock Assistant, discover onchain identities

## 3.0.14
* Add .dream TLDs support

## 3.0.13
* Add .lfg TLDs support

## 3.0.12
* Add .smobler TLDs support

## 3.0.11
* Add .dfz TLDs support

## 3.0.10
* Add .farms TLDs support

## 3.0.9
* Add .tball TLDs support

## 3.0.8
* Add .ubu TLDs support

## 3.0.7
* Add .kryptic TLDs support

## 3.0.6
* Add .stepn TLDs support

## 3.0.4
* Add .raiin TLDs support

## 3.0.3
* Add .secret TLDs support

## 3.0.2
* Add .wrkx TLDs support
* Disable https://api.unstoppabledomains.com redirection

## 3.0.1
* Add .metropolis TLDs support

## 3.0.0
* Migrated to manifest v3

## 2.3.16
* Add .witg TLDs support

## 2.3.15
* Add .clay TLDs support

## 2.3.14
* Add .pog TLDs support

## 2.3.13
* Add .bitget TLDs support

## 2.3.12
* Add .austin TLDs support

## 2.3.11
* Trim the extra / for redirect IPFS URL

## 2.3.10
* Add .pudgy TLDs support

## 2.3.9
* Add .unstoppable TLDs support

## 2.3.8
* Add .altimist TLDs support

## 2.3.7
* Add .go TLDs support

## 2.3.6
* Fixed issue with custom IPFS url is not saved

## 2.3.5
* Add .binanceus TLDs support

## 2.3.4
* Add .anime and .manga TLDs support

## 2.3.3
* Add .polygon TLD support
* Remove .coin TLD support

## 2.3.2
* Add .kresus and .klever TLDs support
* Updated resolution library to 8.5.0

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
