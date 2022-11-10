// deno-lint-ignore no-explicit-any
function asString(input: any): string | undefined {
  if (input === undefined) {
    return "undefined";
  }
  if (input === null) {
    return "null";
  }
  if (input instanceof Date) {
    return input.toISOString();
  }
  if (Array.isArray(input)) {
    const mapped = input.map((v) => asString(v));
    return `[${mapped.join(", ")}]`;
  }
  if (input?.constructor === Object) {
    const entries = Object.entries(input).map(
      ([k, v]) => `${k}: ${asString(v)}`
    );
    return `{${entries.join(", ")}}`
  }

  return input.toString();
}

// deno-lint-ignore no-explicit-any
export function format(msg: string, extra?: Record<string, any>): string {
  const labels: string[] = (extra)
    ? Object.entries(extra)
      .map(([k, v]) => `${k}=${asString(v)}`)
    : [];

  return (labels.length > 0) ? `${msg}: [ ${labels.join("; ")} ]` : msg;
}

export abstract class ErrBase extends Error {
  // deno-lint-ignore no-explicit-any
  constructor(msg: string, extra?: Record<string, any>) {
    super(format(msg, extra));
    this.name = this.constructor.name;
    this.stack = (new Error()).stack;
  }
}
