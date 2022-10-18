// deno-lint-ignore no-explicit-any
export function format(msg: string, extra?: { [index: string]: any }): string {
  const labels: string[] = (extra)
    ? Object.entries(extra)
      .map((e) => `${e[0]}=${e[1]}`)
    : [];

  return (labels.length > 0) ? `${msg}: [ ${labels.join("; ")} ]` : msg;
}

abstract class ErrBase extends Error {
  // deno-lint-ignore no-explicit-any
  constructor(msg: string, extra?: { [id: string]: any }) {
    super(format(msg, extra));
    this.name = this.constructor.name;
    this.stack = (new Error()).stack;
  }
}

export class InvalidNameError extends ErrBase {
  readonly value: string;

  constructor(value: string, msg = "invalid name") {
    super(msg, { value });
    this.value = value;
  }
}
