/** */

import { InvalidLogLevel } from "./errors.ts";

// ##### LEVEL DATA #####
export enum LogLevel {
  OFF,
  DEBUG,
  VERBOSE,
  INFO,
  WARNING,
  ERROR,
  ALL,
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
  const msg = (typeof record.message === "string") ?
      record.message : record.message();

  return `${ts} [${lvl}]: ${msg}`;
}

// ##### LOGGER #####

export class Logger {
  readonly level: LogLevel;
  #writer: Deno.WriterSync;

  constructor(level = LogLevel.INFO, writer = Deno.stderr) {
    this.level = level;
    this.#writer = writer;
  }

  #loggit(record: LogRecord) {
    if (record.level < this.level) {
      // record level too low
      return;
    }

    const output = (new TextEncoder()).encode(format(record));
    this.#writer.writeSync(output);
  }
}
