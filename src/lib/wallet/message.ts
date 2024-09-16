import {ClientSideRequestType} from "../../types/wallet/provider";
import {Logger} from "../logger";

export const sendMessageToClient = async (type: ClientSideRequestType) => {
  Logger.log("Sending message to client", type);
  chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {type});
  });
};
