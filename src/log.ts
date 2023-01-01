import { log as logger } from "./deps.ts";
// TODO: figure out a better way to get the LogRecord class ...
import { LogRecord } from "https://deno.land/std@0.161.0/log/logger.ts";
export const {
  getLogger,
  LogLevels,
} = logger;

export interface LogRecordOpts {
  level: number;
  msg: string;
}

export function record(opts: LogRecordOpts): LogRecord {
  return new LogRecord({
    ...opts,
    loggerName: getLogger().loggerName,
    args: [],
  });
}

function formatElapsed(ts: Date): string {
  const now = (ts.getTime() - startedAt).toString();
  return `${now}ms`;
}

export function formatString(record: LogRecord): string {
  const timestamp = formatElapsed(record.datetime);
  const level = record.levelName;
  const msg = record.msg;

  return `${timestamp} ${level} - ${msg}`;
}

const console = new logger.handlers.ConsoleHandler("DEBUG", {
  formatter: formatString,
});

export function verbose(): string {
  const level = "DEBUG";
  logger.getLogger().levelName = level;
  return level;
}
export function quiet(): string {
  const level = "WARNING";
  logger.getLogger().levelName = level;
  return level;
}

export default {
  debug: logger.debug,
  info: logger.info,
  warning: logger.warning,
  error: logger.error,
  critical: logger.critical,
};

let startedAt = Date.now();
export function startAt(ts = new Date()) {
  startedAt = ts.getTime();
}

logger.setup({
  handlers: {
    console,
  },
  loggers: {
    default: {
      level: "INFO",
      handlers: ["console"],
    },
  },
});
