/** */

import { InvalidVariableName } from "./errors.ts";

export type Variables = Record<string, string>;

export interface VariablesContext {
  readonly parent?: VariablesContext;
  readonly vars: Variables;
}

const RE_VARNAME = /^[_a-zA-Z][_a-zA-Z0-9]*$/;

function validate(name: string): string {
  RE_VARNAME.lastIndex = 0;
  if (!RE_VARNAME.test(name)) {
    throw new InvalidVariableName(name);
  }

  return name;
}

const RE_INTERPOLATION = /\$(?:\$|\{([_a-zA-Z][_a-zA-Z0-9]*)(?:\:-(.*))?\})/g;

function interpolate(value: string, envs: Variables): string {
  return value.replaceAll(RE_INTERPOLATION, (match, name, defaultVal) => {
    if (match === "$$") {
      return "$";
    }
    return envs[name] ?? defaultVal ?? "";
  });
}

export function format(ctx: VariablesContext, envs?: Variables): Variables {
  envs = {
    ...envs,
  };

  if (ctx.parent) {
    envs = format(ctx.parent, envs);
  }

  for (const [name, value] of Object.entries(ctx.vars)) {
    envs[validate(name)] = interpolate(value, envs);
  }

  return envs;
}
