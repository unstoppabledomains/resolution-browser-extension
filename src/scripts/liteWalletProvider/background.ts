import config from "../../config";
import {Logger} from "../../lib/logger";
import {
  getConnectedSite,
  setConnectedSite,
} from "../../lib/wallet/evm/connection";
import {getWalletPreferences} from "../../lib/wallet/preferences";
import {ConnectedSite} from "../../types/wallet/connection";
import {
  NotConnectedError,
  ProviderEventResponse,
  ProviderRequest,
  getResponseType,
  isExternalRequestType,
  isInternalRequestType,
  isResponseType,
} from "../../types/wallet/provider";

// keep track of the wallet extension popup window ID
let extensionPopupWindowId = null;

// backgroundEventListener listens for requests to open the wallet extension popup. Awkward note
// that the signature cannot contain async, even though the contents of this method do call some
// promises. They must be handled using .then() pattern, due to the way event listeners work in
// chrome extensions.
export const backgroundEventListener = (
  request: ProviderRequest,
  _sender: chrome.runtime.MessageSender,
  popupResponseHandler: (response: ProviderEventResponse) => void,
) => {
  // log the incoming event
  Logger.log("Handling event start", JSON.stringify(request));

  // handle internal request types
  if (isInternalRequestType(request.type)) {
    switch (request.type) {
      case "getPreferencesRequest":
        void handleFetchPreferences(popupResponseHandler);
        break;
    }
    return true;
  }

  // handle external request types
  if (isExternalRequestType(request.type)) {
    // find the active tab that requested the wallet extension popup
    chrome.tabs
      .query({
        active: true,
      })
      .then((activeTabs) => {
        // retrieve the hostname parameter from the request params, which can safely be
        // popped from the list since no other callers expect it
        const requestHost = request.params.pop();

        // scan the active tabs for the expected hostname of the calling application. This
        // data is used for context in the wallet extension popup window
        const requestSource = activeTabs.find((t) =>
          t.url?.toLowerCase().includes(requestHost.toLowerCase()),
        );

        // generate a URL with encoded state to open a wallet extension popup. The pieces encoded state
        // includes information about the tab requesting the popup, and the wallet provider request
        // parameters that should be handled by the popup.
        const requestUrl = chrome.runtime.getURL(
          `index.html?request=${encodeURIComponent(JSON.stringify(request))}&source=${encodeURIComponent(JSON.stringify(requestSource))}#connect`,
        );

        // retrieve wallet connection data for this site
        getConnectedSite(requestHost).then((walletConnection) => {
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
            // if a popup window is already open, use it
            chrome.tabs.query(
              {windowId: extensionPopupWindowId},
              (extensionPopupWindow) => {
                if (extensionPopupWindow.length === 0) {
                  // the previous window ID has been closed, so a new extension popup
                  // needs to be opened
                  extensionPopupWindowId = null;
                  openPopupWindow(
                    popupResponseHandler,
                    requestUrl,
                    requestHost,
                  );
                } else {
                  // listen for a response on the existing wallet extension popup
                  listenForPopupResponse(popupResponseHandler, requestHost);
                }
              },
            );
          } else {
            // open a new wallet extension popup
            openPopupWindow(popupResponseHandler, requestUrl, requestHost);
          }
        });
      });

    // successfully handled request to open wallet extension popup
    return true;
  }
};

// openPopupWindow creates a new wallet extension popup window
const openPopupWindow = (
  popupResponseHandler: (response: ProviderEventResponse) => void,
  popupUrl: string,
  host: string,
) => {
  // open a new wallet extension popup
  chrome.windows.create(
    {
      url: popupUrl,
      type: "popup",
      width: 400,
      height: 630,
    },
    (window) => {
      // store the ID of the popup
      extensionPopupWindowId = window.id;

      // listen for a response from the popup
      listenForPopupResponse(popupResponseHandler, host);
    },
  );
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
      if (response && "address" in response) {
        const connection: ConnectedSite = {
          accounts: [response.address],
          chainId: response.chainId,
          permissions: response?.permissions,
          timestamp: new Date().getTime(),
        };
        void setConnectedSite(host, connection);
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
  // log the incoming event
  Logger.log("Handling event complete", JSON.stringify(response));
  popupResponseHandler(response);
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
