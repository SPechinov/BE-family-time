import pino, {
  Bindings,
  LoggerOptions,
  ChildLoggerOptions,
  Logger as PinoLogger,
  LevelWithSilentOrString,
  LogFn,
} from 'pino';

export interface ILogger {
  level: LevelWithSilentOrString;
  fatal: LogFn;
  error: LogFn;
  warn: LogFn;
  info: LogFn;
  debug: LogFn;
  trace: LogFn;
  silent: LogFn;
  child: (bindings: Bindings, options?: ChildLoggerOptions) => ILogger;
}

export class Logger implements ILogger {
  readonly #logger: PinoLogger;

  constructor(optionsOrLogger: LoggerOptions | PinoLogger = {}) {
    this.#logger = this.#getIsPinoLogger(optionsOrLogger) ? optionsOrLogger : pino(optionsOrLogger);
  }

  #getIsPinoLogger(optionsOrLogger?: LoggerOptions | PinoLogger): optionsOrLogger is PinoLogger {
    return typeof (optionsOrLogger as PinoLogger).child === 'function';
  }

  get level() {
    return this.#logger.level;
  }

  fatal(...args: Parameters<LogFn>): ReturnType<LogFn> {
    return this.#logger.fatal(...args);
  }

  error(...args: Parameters<LogFn>): ReturnType<LogFn> {
    return this.#logger.error(...args);
  }

  warn(...args: Parameters<LogFn>): ReturnType<LogFn> {
    return this.#logger.warn(...args);
  }

  info(...args: Parameters<LogFn>): ReturnType<LogFn> {
    return this.#logger.info(...args);
  }

  debug(...args: Parameters<LogFn>): ReturnType<LogFn> {
    return this.#logger.debug(...args);
  }

  trace(...args: Parameters<LogFn>): ReturnType<LogFn> {
    return this.#logger.trace(...args);
  }

  silent(...args: Parameters<LogFn>): ReturnType<LogFn> {
    return this.#logger.silent(...args);
  }

  child(bindings: Bindings, options?: ChildLoggerOptions): ILogger {
    return new Logger(this.#logger.child(bindings, options));
  }
}
