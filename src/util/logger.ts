class Logger {
  private isDevMode: boolean;
  private static _instance?: Logger;

  private constructor() {
    const manifestVersion = chrome.runtime.getManifest().version_name || '';
    this.isDevMode = manifestVersion.includes('-dev_mode-');
  }

  public static getLogger() {
      if (!this._instance) {
        this._instance = new this();
      }

      return this._instance;
  }

  public log(mes: any) {
    if (this.isDevMode) {
      console.log(mes);
    }
  }
}

const logger = Logger.getLogger();
export default logger;