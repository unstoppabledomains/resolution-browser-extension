import {BugsnagErrorClasses, notifyBugsnag} from "@unstoppabledomains/config";
import config from "../config";

const PREFIX = "Unstoppable Domains";

export class Logger {
  // standardized log messages
  static log(message: string, ...optionalParams: any[]) {
    console.log(`[${PREFIX}] ${message}`, ...optionalParams);
  }

  // standardized warn messages
  static warn(message: string, ...optionalParams: any[]) {
    console.warn(`[${PREFIX}] ${message}`, ...optionalParams);
  }

  // standardized error messages
  static error(
    e: Error,
    type: keyof typeof BugsnagErrorClasses,
    message?: string,
    ...optionalParams: any[]
  ) {
    // print error to console
    console.error(`[${PREFIX}] ${String(e)}`, message, ...optionalParams);

    // collect error data with bugsnag for problem determination
    notifyBugsnag(
      {
        appContext: "Extension",
        errorClass: type,
        error: e,
        severity: "error",
        metadata: {
          message,
          args: optionalParams,
        },
      },
      {
        api_key: config.BUGSNAG_API_KEY,
        app_version: config.APP_VERSION,
        app_env: config.NODE_ENV,
      },
    );
  }
}
