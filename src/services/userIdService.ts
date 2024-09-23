import {Logger} from "../lib/logger";

class UserIdService {
  private static readonly USER_ID_KEY = "userId";

  private generateUUID(): string {
    let d = new Date().getTime();
    let d2 = (performance && performance.now && performance.now() * 1000) || 0;
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        let r = Math.random() * 16;
        if (d > 0) {
          r = (d + r) % 16 | 0;
          d = Math.floor(d / 16);
        } else {
          r = (d2 + r) % 16 | 0;
          d2 = Math.floor(d2 / 16);
        }
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      },
    );
  }

  private storeUserId(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set({[UserIdService.USER_ID_KEY]: userId}, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  public getUserId(): Promise<string> {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get([UserIdService.USER_ID_KEY], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else if (result[UserIdService.USER_ID_KEY]) {
          resolve(result[UserIdService.USER_ID_KEY]);
        } else {
          Logger.log("User ID not found, generating a new one.");
          const newUserId = this.generateUUID();
          this.storeUserId(newUserId)
            .then(() => resolve(newUserId))
            .catch(reject);
        }
      });
    });
  }
}

export default UserIdService;
