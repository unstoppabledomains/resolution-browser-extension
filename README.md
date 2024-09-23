# Unstoppable Domains Browser Extension

**The Unstoppable Domains Browser Extension** enables access to onchain applications and domains, facilitating a secure and user-driven experience. The extension includes an integrated wallet with support for multiple blockchains such as Bitcoin, Ethereum, Base, Polygon and Solana. Using the wallet, users can manage their onchain assets directly from the browser and interact with onchain applications. 

Additionally, the extension integrates with decentralized storage networks such as IPFS to resolve domain names stored on the blockchain, such as `.crypto` and `.eth`, directly within the browser.

## Getting Started

### Prerequisites

Ensure that you have `node` (version 16) and `yarn` installed on your machine. If not, you can install it via [Yarn's official documentation](https://classic.yarnpkg.com/en/docs/install).

### Running locally

1. Clone the repository:
   ```bash
   git clone <repository-url>

3. Copy .env.template to .env and fill in the required values:
   ```bash
   cp .env.template .env
   ```

4. Install dependencies and setup your environment:
   ```bash
   yarn install
   ```

5. Run the project locally:
   ```bash
   yarn dev
   ```

6. Once the build is complete, open `chrome://extensions` in your Chrome browser, enable Developer mode, and load the unpacked extension by selecting the `dist` folder.

### Distribution

This package has builds extension releases for Chrome and Firefox browsers. Follow the steps below
to build a new release version.

1. Update the release version in the `package.json` file

2. Build a release for distribution
   ```bash
   ##################################
   # Build everything
   ##################################

   yarn dist

   ##################################
   # Build specific release version
   ##################################

   # For a mainnet production release
   NODE_ENV=production; yarn build:all

   # For a testnet development release
   NODE_ENV=staging; yarn build:all
   ```

3. Find the release files in the `./releases` directory

## Usage

### Basic instructions

1. Open the extension popup window.
1. Select a sign in option
   1. Existing users may enter their user name and password
   1. New users may create a new account
1. Manage wallet
   1. Send / receive crypto by navigating to the desired blockchain asset
   1. Update wallet settings using the "Settings" menu option
      1. Compatibility mode - emulates MetaMask
      1. Connections
1. Interact with blockchain applications
   1. The extension will automatically popup when a blockchain application requests to interact with your wallet. For example, the extension may popup for the following application scenarios:
      1. Connection requests
      1. Permission requests
      1. Message signatures
      1. Transaction approvals
   1. Wallet operations only proceed with your approval
1. Send a message using XMTP
   1. Click the menu options at the top right of the extension
   1. Select the `Messages` option
   1. Select a conversation
      1. Find an existing conversation from the list (if available)
      1. Create a new conversation
         1. Select the search text box
         1. Type a wallet address or domain name
         1. Select the chat partner for a new conversation
1. Sherlock Assistant
   1. When enabled, Sherlock Assistant finds onchain domain names associated with Ethereum wallet addresses as you browse the web
      1. Updates your webpage to display onchain domain name
   1. Enable / disable Sherlock Assistant
      1. From settings
         1. Click the menu options at the top right of the extension
         1. Update the checkbox option to enable/disable the Sherlock Assistant globally
      1. From a context menu
         1. Right click any webpage to enable/disable Sherlock Assistant for a specific website
1. Decentralized browsing
   1. Type in a blockchain domain (like matt.crypto) in the browser URL field
   1. You will be redirected to the IPFS gateway with the domain’s IPFS hash record

## Sample screenshots

### User onboarding
#### Upgrade to new version screen
<img width="396" alt="image" src="https://github.com/user-attachments/assets/7983ea80-ea0f-49cb-8444-42eee738ba02">

#### Sign in screen
<img width="397" alt="image" src="https://github.com/user-attachments/assets/3128d366-46a9-469f-be7c-a805cd5681a4">

#### Account entry screen
<img width="397" alt="image" src="https://github.com/user-attachments/assets/e9adb7e8-64dd-413c-92f8-4f8ec020e1b6">

### Main screen
<img width="398" alt="image" src="https://github.com/user-attachments/assets/e4542126-678c-47ef-90d6-e091f2ef14f2">

### Menu options
<img width="396" alt="image" src="https://github.com/user-attachments/assets/1e95566e-6262-4684-a9b6-6f0ba9a67e7b">

### Settings
<img width="394" alt="image" src="https://github.com/user-attachments/assets/c88cd269-4ea0-4619-8909-72c12fabfe71">

### Messages
#### Chat window
<img width="395" alt="image" src="https://github.com/user-attachments/assets/80ab133c-01b6-488b-b195-a494faea4205">

#### Receiving a message notification
<img width="372" alt="image" src="https://github.com/user-attachments/assets/930a31f8-ea19-4085-bbcd-6800be14023b">

### Sending crypto to another wallet
#### Choose recipient and amount
<img width="393" alt="image" src="https://github.com/user-attachments/assets/04d29892-9077-4f4f-afbc-d57b9a126862">

#### Confirmation
<img width="396" alt="image" src="https://github.com/user-attachments/assets/f45ec91c-46b2-4c62-9c5f-e13704ff99b1">

#### Progress
<img width="397" alt="image" src="https://github.com/user-attachments/assets/c03c8ca4-fde9-4cf4-b4cd-0d23ecdf09c6">

### Interacting with an app
#### Connecting wallet
<img width="1044" alt="image" src="https://github.com/user-attachments/assets/b20a2092-f30a-406e-9780-49c4017e3403">

#### Approving connection
<img width="1058" alt="image" src="https://github.com/user-attachments/assets/a40ff586-a24e-4153-9347-d3d72c82fd35">

#### Approving a signature
<img width="1055" alt="image" src="https://github.com/user-attachments/assets/157825a7-fc8f-4df0-aeb9-b895558f465a">

## Frequently Asked Questions (FAQ)

### Why does this extension require access to `*.google.com` and other search engine domains?

This access is essential for redirecting queries from major search engines like Google to decentralized addresses. For instance, searching for "brad.crypto" will redirect to its decentralized counterpart. Note that this extension _does not_ store or transmit your browsing history; all processing is done locally on your device.

### How can I add support for additional search engines?

Adding a new search engine is straightforward:

1. Update the `manifest-template.json` file to include permissions for intercepting requests from the new search engine.
2. Modify `src/util/searchEngines.ts` to incorporate the new search engine's specific configurations.

Submit a pull request with these changes, and we will integrate the support promptly.
