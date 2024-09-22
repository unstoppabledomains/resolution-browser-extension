import {
  ClientSideRequestType,
  InternalRequestType,
} from "../../types/wallet/provider";
import {Logger} from "../logger";

export const sendMessageToClient = async (type: ClientSideRequestType) => {
  Logger.log("Sending message to client", type);
  chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {type});
  });
};

export const sendMessageToBackground = async <T>(
  type: InternalRequestType,
  data?: T,
) => {
  Logger.log("Sending message to background", type);
  chrome.runtime.sendMessage({
    type,
    params: data ? [data] : undefined,
  });
};
