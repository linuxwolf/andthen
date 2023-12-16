/** */

import { InvalidVariableName } from "./errors.ts";

export type Variables = Record<string, string>;

export interface VariablesContext {
  readonly parent?: VariablesContext;
  readonly vars?: Variables;
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

export function collapse(ctx: VariablesContext, vars?: Variables): Variables {
  const result = (ctx.parent && collapse(ctx.parent, vars)) || {};

  function replacer(match: string, name?: string) {
    if (name !== undefined) {
      return result[name] ?? match;
    }
    return match;
  }

  for (const [name, value] of Object.entries(ctx.vars || {})) {
    result[validate(name)] = value.replaceAll(RE_INTERPOLATION, replacer);
  }

  return result;
}

export function resolve(vars: Variables, envs?: Variables): Variables {
  const result = { ...envs };

  function replacer(match: string, name?: string, defaultVal?: string) {
    if (match === "$$") {
      return "$";
    }

    return result[name!] ?? defaultVal ?? "";
  }

  for (const [name, value] of Object.entries(vars)) {
    result[validate(name)] = value.replaceAll(RE_INTERPOLATION, replacer);
  }

  return result;
}

export function resolveAll(ctx: VariablesContext, envs?: Variables): Variables {
  const vars = collapse(ctx);
  return resolve(vars, envs);
}
