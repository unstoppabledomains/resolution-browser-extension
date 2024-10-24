import {initXmtpAccount} from "@unstoppabledomains/ui-components/components/Chat/protocol/xmtp";
import {getXmtpLocalKey} from "@unstoppabledomains/ui-components/components/Chat/storage";
import {Logger} from "../logger";
import {getSigner} from "../wallet/signer";
import {waitForXmtpMessages} from "./listener";
import {fetcher} from "@xmtp/proto";
import {getAccounts} from "@unstoppabledomains/ui-components/actions/fireBlocksActions";
import {getWalletPreferences} from "../wallet/preferences";
import {Mutex} from "async-mutex";

// ensure a single XMTP account is requested at a time
const xmtpMutex = new Mutex();

export const prepareXmtpAccount = async (
  accessToken: string,
  address: string,
) => {
  await xmtpMutex.runExclusive(async () => {
    // check XMTP preferences
    const preferences = await getWalletPreferences();
    if (!preferences.MessagingEnabled) {
      return;
    }

    // if an XMTP key is already available, ensure that we are listening for new
    // messages on the service worker
    let xmtpKey = await getXmtpLocalKey(address);
    if (xmtpKey) {
      void waitForXmtpMessages(fetcher.b64Encode(xmtpKey, 0, xmtpKey.length));
      return;
    }

    // initialize the XMTP account
    Logger.log("Preparing XMTP account", address);

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
    xmtpKey = await getXmtpLocalKey(address);
    if (!xmtpKey) {
      Logger.warn("XMTP key is not available", address);
      return;
    }
    void waitForXmtpMessages(fetcher.b64Encode(xmtpKey, 0, xmtpKey.length));
  });
};
