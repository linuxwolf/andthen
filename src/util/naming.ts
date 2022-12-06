import * as errors from "../errors/mod.ts";

const NAME_PTN = /^([\.\-_$:]|[a-zA-Z0-9])([a-zA-Z0-9]+[\.\-_$:]*)*$/u;

export function validateName(name: string, allowEmpty = false): boolean {
  if (!name && allowEmpty) return true;
  return NAME_PTN.test(name);
}

export function checkName(name: string, allowEmpty = false): string {
  if (!validateName(name, allowEmpty)) {
    throw new errors.InvalidName(name);
  }
  return name;
}
