import {initXmtpAccount} from "@unstoppabledomains/ui-components/components/Chat/protocol/xmtp";
import {getXmtpLocalKey} from "@unstoppabledomains/ui-components/components/Chat/storage";
import {Logger} from "../logger";
import {getSigner} from "../wallet/signer";
import {waitForXmtpMessages} from "./listener";
import {fetcher} from "@xmtp/proto";
import {getAccounts} from "@unstoppabledomains/ui-components/actions/fireBlocksActions";

export const prepareXmtpAccount = async (
  accessToken: string,
  address: string,
) => {
  // no work to do if XMTP is already enabled
  if (await getXmtpLocalKey(address)) {
    Logger.log("XMTP account is ready", address);
    return;
  }

  // initialize the XMTP account
  Logger.log("Preparing XMTP account", address, accessToken);

  // validate the access token
  const accounts = await getAccounts(accessToken);
  if (!accounts) {
    Logger.warn("no accounts");
    return;
  }

  // sign in to XMTP using the provided address and token
  const signer = await getSigner(address, accessToken);
  await initXmtpAccount(address, signer as any);

  // listen for messages in the service worker if an XMTP key has been
  // successfully initialized
  const xmtpKey = await getXmtpLocalKey(address);
  if (!xmtpKey) {
    Logger.warn("XMTP key is not available", address);
  }
  void waitForXmtpMessages(fetcher.b64Encode(xmtpKey, 0, xmtpKey.length));
};
