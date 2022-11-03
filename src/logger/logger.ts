export type ILoggerOptions = {
  isVerbose: boolean;
};

export class Logger {
  protected static instance: Logger;

  static log(...args: any) {
    Logger.init()._log(...args);
  }

  static verbose(...args: any) {
    Logger.init()._verbose(...args);
  }

  static init(options?: ILoggerOptions) {
    if (!Logger.instance) {
      Logger.instance = new Logger(options);
    }

    return Logger.instance;
  }

  private constructor(private readonly options?: ILoggerOptions) {}

  private _log(...args: any) {
    console.info(...args);
  }

  private _verbose(...args: any) {
    if (this.options?.isVerbose) {
      console.info(...args);
    }
  }
}
