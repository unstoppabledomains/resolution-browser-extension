import {getXmtpLocalKey} from "@unstoppabledomains/ui-components/components/Chat/storage";
import {Logger} from "../logger";
import {fetcher} from "@xmtp/proto";
import {sendMessageToBackground} from "../wallet/message";

export const notifyXmtpServiceWorker = async (address: string) => {
  // retrieve the XMTP key
  const xmtpKey = getXmtpLocalKey(address);
  if (!xmtpKey) {
    Logger.warn("XMTP key not available");
    return false;
  }

  // encode the key for transport
  const xmtpKeyEncoded = fetcher.b64Encode(xmtpKey, 0, xmtpKey.length);

  // provide the key to service worker
  await sendMessageToBackground("xmtpReadyRequest", xmtpKeyEncoded);
};
