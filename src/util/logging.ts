/** */

import { configure, getLogger } from "@logtape/logtape";
import type {
  Logger,
  LogLevel,
  LogRecord,
  Sink,
  TextFormatter,
} from "@logtape/logtape";
import type { WriterSync } from "@std/io";
import * as colors from "@std/fmt/colors";

// ##### FORMATTING #####
function formatData(data: unknown): string {
  if (typeof data === "string") {
    return data;
  }
  return Deno.inspect(data);
}

export function simpleFormatter(record: LogRecord): string {
  const message = record.message.map(formatData).join("");

  return message;
}

const LEVEL_PADDING_LEN = 7;

function formatLevel(level: LogLevel): string {
  let result: string;
  switch (level) {
    case "debug":
      result = colors.blue(level);
      break;
    case "info":
      result = colors.green(level);
      break;
    case "warning":
      result = colors.yellow(level);
      break;
    case "error":
      result = colors.red(level);
      break;
    case "fatal":
      result = colors.brightMagenta(level);
      break;
  }
  result = result + "".padEnd(LEVEL_PADDING_LEN - level.length);

  return result;
}

export function detailedFormatter(record: LogRecord): string {
  const timestamp = new Date(record.timestamp).toISOString();
  const level = formatLevel(record.level);
  const category = record.category.slice(1).join(" » ");
  const message = record.message.map(formatData).join("");

  return `${timestamp} [${level}] ${category}: ${message}`;
}

// ##### SINKS #####

export interface SinkOptions {
  writer: WriterSync;
  formatter: TextFormatter;
}

export function makeStdioSink(opts: SinkOptions): Sink {
  const writer = opts.writer;
  const formatter = opts.formatter;
  const encoder = new TextEncoder();

  return (record: LogRecord) => {
    const msg = formatter(record);
    const encoded = encoder.encode(msg + "\n");
    writer.writeSync(encoded);
  };
}

// ##### PUBLIC #####

export default function logger(...category: string[]): Logger {
  return getLogger(["app", ...category]);
}

export async function setup() {
  // TODO: parameterize
  const level = "info";
  const formatter = simpleFormatter;
  const stdio = makeStdioSink({
    writer: Deno.stderr,
    formatter,
  });

  await configure({
    sinks: {
      stdio,
    },
    loggers: [
      {
        // meta logger -- disabled
        category: ["logtape", "meta"],
        level: "fatal",
      },
      {
        // default "app" logger
        category: ["app"],
        sinks: ["stdio"],
        level,
      },
    ],
  });
}
