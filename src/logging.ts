/** */

import { InvalidLogLevel } from "./errors.ts";

// ##### LEVEL DATA #####
export enum LogLevel {
  ALL,
  DEBUG,
  VERBOSE,
  INFO,
  WARN,
  ERROR,
  OFF,
}

type LogLevelName = keyof typeof LogLevel;

export function getNameForLevel(lvl: LogLevel): string {
  return LogLevel[lvl];
}

export function getLevelForName(name: string): LogLevel {
  const lvlName = name as LogLevelName;
  if (!(lvlName in LogLevel)) {
    throw new InvalidLogLevel(name);
  }

  return LogLevel[lvlName];
}

// ##### RECORD DATA #####

export type LogMessage = string | (() => string);
export interface LogRecord {
  readonly timestamp: Date;
  readonly level: LogLevel;
  readonly message: LogMessage;
}

export function format(record: LogRecord): string {
  const lvl = getNameForLevel(record.level);
  const ts = record.timestamp.toISOString();
  const msg = (typeof record.message === "string")
    ? record.message
    : record.message();

  return `${ts} [${lvl}]: ${msg}`;
}

// ##### LOGGER #####

export interface Consoler {
  // deno-lint-ignore no-explicit-any
  info(msg: string, ...args: any[]): void;
  // deno-lint-ignore no-explicit-any
  error(msg: string, ...args: any[]): void;
}

export class Logger {
  static readonly DEBUG = LogLevel.DEBUG;
  static readonly VERBOSE = LogLevel.VERBOSE;
  static readonly INFO = LogLevel.INFO;
  static readonly WARN = LogLevel.WARN;
  static readonly ERROR = LogLevel.ERROR;

  #level: LogLevel;
  readonly output: Consoler;

  constructor(level = LogLevel.INFO, output: Consoler = console) {
    this.#level = level;
    this.output = output;
  }

  get level() {
    return this.#level;
  }

  get levelName() {
    return getNameForLevel(this.#level);
  }

  louder(): LogLevel {
    if (this.#level > LogLevel.ALL) {
      this.#level--;
    }

    return this.#level;
  }
  quieter(): LogLevel {
    if (this.#level < LogLevel.OFF) {
      this.#level++;
    }

    return this.#level;
  }

  #loggit(record: LogRecord) {
    if (record.level < this.level) {
      // record level too low
      return;
    }

    this.output.error(format(record));
  }

  debug(message: LogMessage) {
    this.#loggit({
      timestamp: new Date(),
      level: LogLevel.DEBUG,
      message,
    });
  }

  verbose(message: LogMessage) {
    this.#loggit({
      timestamp: new Date(),
      level: LogLevel.VERBOSE,
      message,
    });
  }

  info(message: LogMessage) {
    this.#loggit({
      timestamp: new Date(),
      level: LogLevel.INFO,
      message,
    });
  }

  warn(message: LogMessage) {
    this.#loggit({
      timestamp: new Date(),
      level: LogLevel.WARN,
      message,
    });
  }

  error(message: LogMessage) {
    this.#loggit({
      timestamp: new Date(),
      level: LogLevel.ERROR,
      message,
    });
  }
}

const DEFAULT_LOGGER = new Logger();
export default DEFAULT_LOGGER;
