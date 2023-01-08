import { fmt } from "./deps.ts";
import { InvalidArgument } from "./errors/mod.ts";
import { Optional } from "./util/types.ts";

export enum Level {
  ALL = "ALL",
  TRACE = "TRACE",
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARNING = "WARNING",
  ERROR = "ERROR",
  CRITICAL = "CRITICAL",
  NONE = "NONE",
}

const LevelNames = Object.keys(Level) as Level[];

export function compareLevels(a: Level, b: Level): number {
  const idxA = LevelNames.indexOf(a);
  const idxB = LevelNames.indexOf(b);

  return idxA - idxB;
}

type LevelName = keyof typeof Level;

export function asString(data: unknown): string {
  switch (typeof data) {
    case "string":
      return data;
    case "bigint":
      // fall through
    case "boolean":
      // fall through
    case "number":
      // fall through
    case "symbol":
      // fall through
    case "undefined":
      return String(data);
    default:
      break;
  }

  if (data === null) {
    return String(data);
  } else if (data instanceof Error) {
    return data.stack!;
  } else if (data instanceof Date) {
    return data.toISOString();
  } else if (typeof data === "object") {
    return JSON.stringify(data);
  }
  return "undefined";
}


export class LogRecord {
  readonly level: Level;
  readonly message: string;
  readonly timestamp: Date;

  constructor(level: Level, message: string, timestamp = new Date()) {
    this.level = level;
    this.message = message;
    this.timestamp = timestamp;
  }

  withLevel(level: Level): LogRecord {
    return new LogRecord(level, this.message, this.timestamp);
  }
}

export class Logger {
  readonly started: Date;
  readonly output: Deno.WriterSync;

  private _level: Level;
  private _encoder = new TextEncoder();

  constructor(level: Level = Level.INFO, timestamp = new Date(), out: Deno.WriterSync = Deno.stderr) {
    this.started = timestamp;
    this._level = level;
    this.output = out;
  }

  get level(): Level {
    return this._level;
  }
  set level(lvl: Level) {
    this._level = lvl;
  }

  trace<T>(message: T) {
    this.log(Level.TRACE, message);
  }
  debug<T>(message: T) {
    this.log(Level.DEBUG, message);
  }
  info<T>(message: T) {
    this.log(Level.INFO, message);
  }
  warning<T>(message: T) {
    this.log(Level.WARNING, message);
  }
  error<T>(message: T) {
    this.log(Level.ERROR, message);
  }
  critical<T>(message: T) {
    this.log(Level.CRITICAL, message);
  }

  log<T>(level: Level, message: T) {
    if (compareLevels(this.level, level) > 0) { return; }

    const record = (message instanceof LogRecord) ?
        (message as LogRecord).withLevel(level) :
        new LogRecord(level, asString(message));
    this.handle(record);
  }

  protected handle(record: LogRecord) {
    let msg = this.format(record);
    switch (record.level) {
      case Level.CRITICAL:
        msg = fmt.bold(fmt.red(msg));
        break;
      case Level.ERROR:
        msg = fmt.red(msg);
        break;
      case Level.WARNING:
        msg = fmt.yellow(msg);
        break;
      case Level.INFO:
        msg = fmt.blue(msg);
        break;
      case Level.DEBUG:
        // fall through
      case Level.TRACE:
        msg = fmt.dim(msg);
        break;
    }
  
    const data = this._encoder.encode(msg + "\n");
    this.output.writeSync(data);
  }

  protected format(record: LogRecord): string {
    const elapsed = `${record.timestamp.getTime() - this.started.getTime()}ms`;
    const level = record.level;
    const message = record.message;

    const msg = `${elapsed} ${level} - ${message}`;

    return msg;
  }
}

let gLogger: Optional<Logger>;

export function getLogger() {
  if (!gLogger) {
    gLogger = new Logger();
  }
  return gLogger;
}
export function setLogger(logger?: Logger) {
  gLogger = logger;
}

export function louder(): Level {
  const logger = getLogger();
  const incr = Math.max(LevelNames.indexOf(logger.level) - 1, 0);

  logger.level = LevelNames[incr];
  return logger.level;
}
export function softer(): string {
  const logger = getLogger();
  const decr = Math.min(LevelNames.indexOf(logger.level) + 1, LevelNames.length - 1);
  logger.level = LevelNames[decr];
  return logger.level;
}

function trace(message: string) {
  getLogger().trace(message);
}

function debug(message: string) {
  getLogger().debug(message);
}

function info(message: string) {
  getLogger().info(message);
}

function warning(message: string) {
  getLogger().warning(message);
}

function error(message: string) {
  getLogger().error(message);
}

function critical(message: string) {
  getLogger().critical(message);
}

export default {
  trace,
  debug,
  info,
  warning,
  error,
  critical,
} as const;
