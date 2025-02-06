/* eslint-disable promise/prefer-await-to-then */
import {utils as web3utils} from "web3";

import {localStorageWrapper} from "@unstoppabledomains/ui-components/components/Chat/storage";
import {getBlockchainSymbolFromChainId} from "@unstoppabledomains/ui-components/components/Manage/common/verification/types";
import {getWeb3} from "@unstoppabledomains/ui-components/lib/wallet/evm/web3";

import config from "../../config";
import {StorageSyncKey, chromeStorageSet} from "../../lib/chromeStorage";
import {Logger} from "../../lib/logger";
import {getDomainProfile, getResolution} from "../../lib/resolver/resolver";
import {getWindow, setBadgeCount, setIcon} from "../../lib/runtime";
import {
  getConnectedSite,
  getConnectedSites,
  setConnectedSite,
} from "../../lib/wallet/evm/connection";
import {getWalletPreferences} from "../../lib/wallet/preferences";
import {sleep} from "../../lib/wallet/sleep";
import {waitForXmtpMessages} from "../../lib/xmtp/listener";
import {prepareXmtpAccount} from "../../lib/xmtp/prepare";
import {ConnectedSite} from "../../types/wallet/connection";
import {
  NotConnectedError,
  ProviderEventResponse,
  ProviderRequest,
  RpcRequest,
  getResponseType,
  isExternalRequestType,
  isInternalRequestType,
  isResponseType,
} from "../../types/wallet/provider";

// keep track of the most recently focussed window ID
export let currentFocussedWindowId: number | undefined;

// keep track of the wallet extension popup window ID
let extensionPopupWindowId: number | undefined;

// tabChangeEventListener listens for tab switches
export const tabChangeEventListener = async (
  tabInfo: chrome.tabs.TabActiveInfo,
) => {
  // retrieve current tab
  const tab = await chrome.tabs.get(tabInfo.tabId);
  await handleTabStatus(tab);
};

// tabUpdatedEventListener listens for changes to existing tabs
export const tabUpdatedEventListener = async (tabId: number) => {
  // retrieve current tab
  const tab = await chrome.tabs.get(tabId);
  await handleTabStatus(tab);
};

// tabCreatedEventListener listens for new tabs
export const tabCreatedEventListener = async (tab: chrome.tabs.Tab) => {
  await handleTabStatus(tab);
};

// backgroundEventListener listens for requests to open the wallet extension popup. Awkward note
// that the signature cannot contain async, even though the contents of this method do call some
// promises. They must be handled using .then() pattern, due to the way event listeners work in
// chrome extensions.
export const backgroundEventListener = (
  request: ProviderRequest,
  _sender: chrome.runtime.MessageSender,
  popupResponseHandler: (response: ProviderEventResponse) => void,
) => {
  // handle incoming internal event
  if (isInternalRequestType(request.type)) {
    switch (request.type) {
      case "getPreferencesRequest":
        void handleFetchPreferences(popupResponseHandler);
        break;
      case "getResolutionRequest":
        void handleFetchResolution(request, popupResponseHandler);
        break;
      case "getDomainProfileRequest":
        void handleFetchDomainProfile(request, popupResponseHandler);
        break;
      case "queueRequest":
        void handleQueueUpdate(request);
        break;
      case "prepareXmtpRequest":
        void handlePrepareXmtp(request, popupResponseHandler);
        break;
      case "xmtpReadyRequest":
        if (request.params && request.params.length > 0) {
          void waitForXmtpMessages(request.params[0]);
        }
        break;
      case "rpcRequest":
        void handleRpcRequest(request, popupResponseHandler);
        break;
    }
    return true;
  }

  // log the incoming external event
  Logger.log("Handling event start", JSON.stringify(request));

  // handle external request types
  if (isExternalRequestType(request.type)) {
    // find the active tab that requested the wallet extension popup
    void chrome.tabs
      .query({
        active: true,
      })
      .then(activeTabs => {
        // retrieve the hostname parameter from the request params, which can safely be
        // popped from the list since no other callers expect it
        const requestHost = request.params.pop();

        // scan the active tabs for the expected hostname of the calling application. This
        // data is used for context in the wallet extension popup window
        const requestSource = activeTabs.find(t =>
          t.url?.toLowerCase().includes(requestHost.toLowerCase()),
        );

        // generate a URL with encoded state to open a wallet extension popup. The pieces encoded state
        // includes information about the tab requesting the popup, and the wallet provider request
        // parameters that should be handled by the popup.
        const requestUrl = chrome.runtime.getURL(
          `index.html?request=${encodeURIComponent(JSON.stringify(request))}&source=${encodeURIComponent(JSON.stringify(requestSource))}#connect`,
        );

        // retrieve wallet connection data for this site
        void getConnectedSite(requestHost).then(walletConnection => {
          // some request types should be processed without a popup, based on the
          // results from existing wallet connection state
          switch (request.type) {
            case "accountRequest":
              // only provide data if the account has been previously connected
              // specifically by the user. Otherwise return a provider error per
              // the EIP-1193 spec
              handleResponse(
                popupResponseHandler,
                walletConnection?.accounts && walletConnection?.chainId
                  ? {
                      type: getResponseType(request.type),
                      address: walletConnection.accounts[0],
                      chainId: walletConnection.chainId,
                    }
                  : {
                      type: getResponseType(request.type),
                      error: NotConnectedError,
                    },
              );
              // popup should not be opened
              return;
            case "chainIdRequest":
              // return a specifically selected chain if available, but always
              // provide at least the default chain ID per the EIP-1193 spec
              handleResponse(popupResponseHandler, {
                type: getResponseType(request.type),
                chainId: walletConnection?.chainId || config.DEFAULT_CHAIN,
                address:
                  walletConnection?.accounts &&
                  walletConnection.accounts.length > 0
                    ? walletConnection.accounts[0]
                    : "",
              });
              // popup should not be opened
              return;
            case "requestPermissionsRequest":
              if (
                walletConnection?.accounts &&
                walletConnection?.chainId &&
                walletConnection?.permissions
              ) {
                // a previously approved permission should be returned, otherwise
                // the user should be prompted for the permission
                handleResponse(popupResponseHandler, {
                  type: getResponseType(request.type),
                  chainId: walletConnection.chainId,
                  address: walletConnection.accounts[0],
                  permissions: walletConnection.permissions,
                });
                // popup should not be opened
                return;
              }
              break;
            case "selectAccountRequest":
              if (walletConnection?.accounts && walletConnection?.chainId) {
                // a previously connected account should be returned, otherwise
                // the user should be prompted for connection
                handleResponse(popupResponseHandler, {
                  type: getResponseType(request.type),
                  chainId: walletConnection.chainId,
                  address: walletConnection.accounts[0],
                });
                // popup should not be opened
                return;
              }
              break;
          }

          // if a widow ID is already generated, use it
          if (extensionPopupWindowId) {
            // brief wait to avoid a race where the window is currently closing while
            // also attempting to query existence
            void sleep(250).then(() => {
              // if a popup window is already open, use it
              chrome.tabs.query(
                {windowId: extensionPopupWindowId},
                extensionPopupWindow => {
                  if (extensionPopupWindow.length === 0) {
                    // the previous window ID has been closed, so a new extension popup
                    // needs to be opened
                    extensionPopupWindowId = undefined;
                    void openPopupWindow(
                      requestUrl,
                      requestSource?.windowId || 0,
                      requestHost,
                      popupResponseHandler,
                    );
                  } else {
                    // listen for a response on the existing wallet extension popup
                    listenForPopupResponse(popupResponseHandler, requestHost);
                  }
                },
              );
            });
          } else {
            // open a new wallet extension popup
            void openPopupWindow(
              requestUrl,
              requestSource?.windowId || 0,
              requestHost,
              popupResponseHandler,
            );
          }
        });
      });

    // successfully handled request to open wallet extension popup
    return true;
  }

  // request was not handled
  return false;
};

// openPopupWindow creates a new wallet extension popup window
export const openPopupWindow = async (
  popupUrl: string,
  windowId: number,
  host?: string,
  popupResponseHandler?: (response: ProviderEventResponse) => void,
) => {
  const parentWindow = await getWindow(windowId);

  // lookup the parent window
  // popup window dimensions
  const popupWidth = 400;
  const popupHeight = 630;

  // determine location of popup based on parent window
  const popupTop = parentWindow?.top;
  const popupLeft =
    parentWindow?.left && parentWindow?.top && parentWindow.width
      ? parentWindow.left + parentWindow.width - popupWidth
      : undefined;

  // open a new wallet extension popup
  const window = await chrome.windows.create({
    url: popupUrl,
    type: "popup",
    focused: true,
    left: popupLeft,
    top: popupTop,
    width: popupWidth,
    height: popupHeight,
  });

  // store the ID of the popup
  extensionPopupWindowId = window.id;

  // listen for a response from the popup
  if (popupResponseHandler && host) {
    listenForPopupResponse(popupResponseHandler, host);
  }

  // return the window ID
  await chromeStorageSet(StorageSyncKey.WindowId, window.id, "session");
  return window.id;
};

// listenForPopupResponse registers a handler to wait for the wallet extension popup
// to respond to the wallet provider request
const listenForPopupResponse = (
  popupResponseHandler: (response: ProviderEventResponse) => void,
  host: string,
) => {
  chrome.runtime.onMessage.addListener(function listener(
    response: ProviderEventResponse,
  ) {
    // ensure the expected response type is handled
    if (isResponseType(response.type)) {
      // ensure the wallet state is persisted as connected to the
      // current host
      if (response && "chainId" in response) {
        const connection: ConnectedSite = {
          accounts: [response.address],
          chainId: response.chainId,
          permissions: response?.permissions,
          timestamp: new Date().getTime(),
        };
        void setConnectedSite(host, connection);
        void setIcon("connected");
      }

      // cleanup the listener and handle the response
      chrome.runtime.onMessage.removeListener(listener);
      handleResponse(popupResponseHandler, response);
    }
  });
};

const handleResponse = (
  popupResponseHandler: (response: ProviderEventResponse) => void,
  response: ProviderEventResponse,
) => {
  // make the response bigint safe
  const normalizedResponse = JSON.parse(
    JSON.stringify(response, (key, value) =>
      typeof value === "bigint" ? web3utils.numberToHex(value) : value,
    ),
  );

  // log the event response
  Logger.log("Handling event complete", JSON.stringify(normalizedResponse));

  // call the response callback with result
  popupResponseHandler(normalizedResponse);
};

const handleTabStatus = async (tab: chrome.tabs.Tab) => {
  if (!tab?.url || !tab.id) {
    return;
  }

  // determine current window ID
  currentFocussedWindowId = tab.windowId;

  // determine if tab is connected
  const hostname = new URL(tab.url).hostname;
  if (await getConnectedSite(hostname)) {
    await setIcon("connected", tab.id);
    return;
  }
  await setIcon("default", tab.id);
};

const handleFetchPreferences = async (
  popupResponseHandler: (response: ProviderEventResponse) => void,
) => {
  const preferences = await getWalletPreferences();
  handleResponse(popupResponseHandler, {
    type: getResponseType("getPreferencesRequest"),
    preferences,
  });
};

const handleFetchDomainProfile = async (
  request: ProviderRequest,
  popupResponseHandler: (response: ProviderEventResponse) => void,
) => {
  if (!request?.params || request.params.length === 0) {
    return;
  }
  const profileData = await getDomainProfile(request.params[0]);
  handleResponse(popupResponseHandler, {
    type: getResponseType("getDomainProfileRequest"),
    profile: profileData,
  });
};

const handlePrepareXmtp = async (
  request: ProviderRequest,
  popupResponseHandler: (response: ProviderEventResponse) => void,
) => {
  // validate params are present
  if (!request?.params || request.params.length === 0) {
    return;
  }

  // parse the parameters and prepare the account
  const params = JSON.parse(request.params[0]);
  if (params?.accessToken && params.address) {
    await prepareXmtpAccount(params.accessToken, params.address);
    handleResponse(popupResponseHandler, {
      type: getResponseType("prepareXmtpRequest"),
      address: params.address,
    });
  }
};

const handleRpcRequest = async (
  request: ProviderRequest,
  popupResponseHandler: (response: ProviderEventResponse) => void,
) => {
  try {
    // requires at least two parameters
    if (!request?.params || request.params.length < 2) {
      throw new Error("invalid parameters");
    }

    // parse the RPC parameters
    const chainId = request.params[0] as number;
    const rpcMethod = request.params[1] as RpcRequest;
    const rpcParams = request.params.length > 2 ? request.params.slice(2) : [];

    // get locally available access token from session
    const accessToken = await localStorageWrapper.getItem("localAccessToken");
    if (!accessToken) {
      throw new Error("invalid access token");
    }

    // get chain symbol
    const chainSymbol = getBlockchainSymbolFromChainId(chainId);
    if (!chainSymbol) {
      throw new Error("invalid chain ID");
    }

    // get associated owner address
    const connectedSites = await getConnectedSites();
    const ownerAddress = Object.keys(connectedSites)
      .map(host => connectedSites[host])
      .find(c => c.chainId === chainId)
      ?.accounts.find(a => a);
    if (!ownerAddress) {
      throw new Error("invalid connected account");
    }

    // get web3 object to proxy RPC requests
    const web3 = getWeb3({
      accessToken,
      chainSymbol,
      ownerAddress,
    });

    // call the web3 provider method
    let result: any | undefined;
    switch (rpcMethod) {
      case "getBlockNumber":
        result = web3utils.numberToHex(await web3.eth.getBlockNumber());
        break;
      case "estimateGas":
        result = web3utils.numberToHex(
          await web3.eth.estimateGas(rpcParams[0]),
        );
        break;
      case "gasPrice":
        result = web3utils.numberToHex(await web3.eth.getGasPrice());
        break;
      case "getBalance":
        result = await web3.eth.getBalance(
          rpcParams[0],
          rpcParams.length > 1 ? rpcParams[1] : undefined,
        );
        if (typeof result !== "string" || !result.startsWith("0x")) {
          result = web3utils.numberToHex(result);
        }
        break;
      case "getCode":
        result = web3.eth.getCode(
          rpcParams[0],
          rpcParams.length > 1 ? rpcParams[1] : undefined,
        );
        break;
      case "getTransaction":
        result = await web3.eth.getTransaction(rpcParams[0]);
        break;
      case "getTransactionReceipt":
        result = await web3.eth.getTransactionReceipt(rpcParams[0]);
        break;
      case "call":
        result = await web3.eth.call(
          rpcParams[0],
          rpcParams.length > 1 ? rpcParams[1] : undefined,
        );
        break;
      default:
        throw new Error(`RPC method not supported: ${rpcMethod}`);
    }

    // parse the parameters and prepare the account
    handleResponse(popupResponseHandler, {
      type: getResponseType("rpcRequest"),
      response: result,
    });
  } catch (e) {
    // provide an error response
    Logger.warn(
      "error handling RPC request",
      JSON.stringify({request, error: String(e)}),
    );
    handleResponse(popupResponseHandler, {
      type: getResponseType("rpcRequest"),
      error: String(e),
    });
  }
};

const handleFetchResolution = async (
  request: ProviderRequest,
  popupResponseHandler: (response: ProviderEventResponse) => void,
) => {
  if (!request?.params || request.params.length === 0) {
    return;
  }
  const resolutionData = await getResolution(request.params[0]);
  handleResponse(popupResponseHandler, {
    type: getResponseType("getResolutionRequest"),
    address: resolutionData?.address || "",
    domain: resolutionData?.domain || "",
    avatar: chrome.runtime.getURL(
      resolutionData?.domain?.endsWith(".eth")
        ? "/icon/ens.png"
        : `/icon/udme/38.png`,
    ),
  });
};

const handleQueueUpdate = async (request: ProviderRequest) => {
  if (!request?.params || request.params.length === 0) {
    return;
  }
  try {
    const count = parseInt(request.params[0], 10);
    await setBadgeCount(count);
  } catch (e) {
    // ignore errors
  }
};
