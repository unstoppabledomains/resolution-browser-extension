//import {initXmtpAccount} from "@unstoppabledomains/ui-components";
import {Logger} from "../logger";
//import {getSigner} from "../wallet/signer";

export const prepareXmtpAccount = async (
  accessToken: string,
  address: string,
) => {
  // initialize the XMTP account
  Logger.log("Preparing XMTP account", address);

  // TODO - AJQ enable these once Fireblocks SDK is removed from codebase
  //const signer = await getSigner(address, accessToken);
  //await initXmtpAccount(address, signer);
};
