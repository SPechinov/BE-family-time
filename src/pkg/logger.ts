import pino, {
  Bindings,
  LoggerOptions,
  ChildLoggerOptions,
  Logger as PinoLogger,
  LevelWithSilentOrString,
  LogFn,
} from 'pino';
import { normalizeQuery } from './sql';

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

  #normalizeArgs(args: Parameters<LogFn>): Parameters<LogFn> {
    const [obj, ...rest] = args;

    // Если первый аргумент — объект с полем query, нормализуем его
    if (obj && typeof obj === 'object' && !Array.isArray(obj) && 'query' in obj && typeof obj.query === 'string') {
      return [{ ...obj, query: normalizeQuery(obj.query) }, ...rest] as Parameters<LogFn>;
    }

    return args;
  }

  get level() {
    return this.#logger.level;
  }

  fatal(...args: Parameters<LogFn>): ReturnType<LogFn> {
    return this.#logger.fatal(...this.#normalizeArgs(args));
  }

  error(...args: Parameters<LogFn>): ReturnType<LogFn> {
    return this.#logger.error(...this.#normalizeArgs(args));
  }

  warn(...args: Parameters<LogFn>): ReturnType<LogFn> {
    return this.#logger.warn(...this.#normalizeArgs(args));
  }

  info(...args: Parameters<LogFn>): ReturnType<LogFn> {
    return this.#logger.info(...this.#normalizeArgs(args));
  }

  debug(...args: Parameters<LogFn>): ReturnType<LogFn> {
    return this.#logger.debug(...this.#normalizeArgs(args));
  }

  trace(...args: Parameters<LogFn>): ReturnType<LogFn> {
    return this.#logger.trace(...this.#normalizeArgs(args));
  }

  silent(...args: Parameters<LogFn>): ReturnType<LogFn> {
    return this.#logger.silent(...this.#normalizeArgs(args));
  }

  child(bindings: Bindings, options?: ChildLoggerOptions): ILogger {
    return new Logger(this.#logger.child(bindings, options));
  }
}
