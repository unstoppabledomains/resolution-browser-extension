import type {IMessagesHandler} from "@fireblocks/ncw-js-sdk";
import config from "../config";

const sendRpcMessage = async (message: unknown, jwt: string): Promise<any> => {
  try {
    const url = `${config.WALLET_API_URL}rpc/messages`;

    const options: RequestInit = {
      method: "POST",
      mode: "cors",
      credentials: "include",
      headers: {
        "Access-Control-Allow-Credentials": "true",
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({message}),
    };

    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (e) {
    console.log("errr", e);
    throw e;
  }
};

export class RpcMessageProvider implements IMessagesHandler {
  private jwt: string;

  constructor(jwt: string) {
    this.jwt = jwt;
  }

  setAuthentication(jwt: string): void {
    this.jwt = jwt;
  }
  async handleOutgoingMessage(message: string): Promise<any> {
    try {
      // console.log("message", message, this.jwt);
      return await sendRpcMessage(message, this.jwt);
    } catch (e) {
      console.log("errr", e);
      return {
        error: {
          message: "unknown",
        },
      };
    }
  }
}
