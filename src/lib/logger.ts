const PREFIX = "Unstoppable Domains";

export class Logger {
  // standardized log messages
  static log(message: string, ...optionalParams: any[]) {
    console.log(`[${PREFIX}] ${message}`, ...optionalParams);
  }

  // standardized error messages
  static error(message: string, ...optionalParams: any[]) {
    console.error(`[${PREFIX}] ${message}`, ...optionalParams);
  }

  // standardized warn messages
  static warn(message: string, ...optionalParams: any[]) {
    console.warn(`[${PREFIX}] ${message}`, ...optionalParams);
  }
}
