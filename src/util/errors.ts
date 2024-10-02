/** */

function formatValue(data: unknown): string {
  switch (typeof data) {
    case "undefined":
      return "undefined";
    case "string":
      return `"${data.toString()}"`;
    case "function":
      return `function ${data.name}`;
    case "bigint":
      // fall through
    case "boolean":
      // fall through
    case "number":
      // fall through
    case "symbol":
      return data.toString();
    default: {
      if (data === null) {
        return "null";
      }
      if (data instanceof Date) {
        return data.toISOString();
      }
      if (data instanceof RegExp) {
        return data.toString();
      }
      if (Array.isArray(data)) {
        return `[${data.map(formatValue).join(", ")}]`;
      }

      const parts = Object.entries(data as Record<string, unknown>)
        .map(([k, v]) => (`${k}: ${formatValue(v)}`))
        .join(", ");
      return `{${parts}}`;
    }
  }
}

export function format(msg: string, details?: Record<string, unknown>): string {
  const extra: string[] = [];

  for (const [key, value] of Object.entries(details || {})) {
    const bit = `${key}=${formatValue(value)}`;

    extra.push(bit);
  }

  if (extra.length == 0) {
    return msg;
  }

  return `${msg} {${extra.join("; ")}}`;
}

export abstract class ErrorBase extends Error {
  constructor(msg: string, details?: Record<string, unknown>) {
    super(format(msg, details));

    this.name = this.constructor.name;
  }
}

class ConfigNotFound extends ErrorBase {
  readonly path: string;

  constructor(path: string, msg = "configuration not found") {
    super(msg, { path });
    this.path = path;
  }
}

class InvalidArgument extends ErrorBase {
  readonly argument: string;
  readonly value: string;

  constructor(argument: string, value: string, msg = "invalid argument") {
    super(msg, { argument, value });
    this.argument = argument;
    this.value = value;
  }
}

export default {
  ConfigNotFound,
  InvalidArgument,
};
