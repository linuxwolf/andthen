const VARDEF_PTN = /(\$\$)|\${([_a-zA-Z][_a-zA-Z0-9]*)(?:(?:\:=)([\s\S]*))?}/g;

export interface Context {
  readonly parent?: Context;
  readonly variables: Variables;
}

export interface VariableBuiler {
  withVariable(key: string, value: string): VariableBuiler;
}

export type Variables = Record<string, string>;

export function evaluate(input: string, vars: Variables): string {
  const replacer = (
    _: string,
    escaped: string,
    varname: string,
    defval?: string,
  ): string => {
    if (escaped === "$$") {
      return "$";
    }

    // QUESTION: recursive substitution?
    if (varname in vars) {
      return vars[varname];
    }
    return defval || "";
  };

  return input.replaceAll(VARDEF_PTN, replacer);
}

export function environ(ctx: Context, env: Variables): Variables {
  const result = (ctx.parent) ? environ(ctx.parent, env) : {} as Variables;

  const resolved: Variables = {};
  for (const [key, value] of Object.entries(ctx.variables)) {
    const sources = {
      ...env,
      ...result,
    };
    result[key] = evaluate(value, sources);
    // make sure values resolved stay resolved!
    resolved[key] = result[key];
  }

  return result;
}
