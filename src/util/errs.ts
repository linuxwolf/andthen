// deno-lint-ignore no-explicit-any
export function format(msg: string, extra?: Record<string, any>): string {
  const labels: string[] = (extra)
    ? Object.entries(extra)
      .map((e) => `${e[0]}=${e[1]}`)
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
