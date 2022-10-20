import { ErrBase } from "./errs.ts";

const NAME_PTN = /^([\.\-_$:]|[a-zA-Z0-9])([a-zA-Z0-9]+[\.\-_$:]*)*$/u;

export class InvalidNameError extends ErrBase {
  readonly value: string;

  constructor(value: string, msg = "invalid name") {
    super(msg, { value });
    this.value = value;
  }
}

export function validateName(name: string, allowEmpty = false): boolean {
  if (!name && allowEmpty) return true;
  return NAME_PTN.test(name);
}

export function checkName(name: string, allowEmpty = false): string {
  if (!validateName(name, allowEmpty)) {
    throw new InvalidNameError(name);
  }
  return name;
}
