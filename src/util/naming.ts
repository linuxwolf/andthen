import { InvalidNameError } from "./errs.ts";

const NAME_PTN = /^([\.\-_$:]|[a-zA-Z0-9])([a-zA-Z0-9]+[\.\-_$:]*)*$/u;

export function validate(name: string, allowEmpty = false): boolean {
  if (!name && allowEmpty) return true;
  return NAME_PTN.test(name);
}

export function check(name: string, allowEmpty = false): string {
  if (!validate(name, allowEmpty)) {
    throw new InvalidNameError(name);
  }
  return name;
}
