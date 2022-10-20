import { ErrBase } from "../util/errs.ts";

const VARDEF_PTN = /(\$\$)|\${([_a-zA-Z][_a-zA-Z0-9]*)(?:(?:\:=)([\s\S]*))?}/g;

export interface Context {
  readonly parent?: Context;
  readonly variables: Variables;
}

export class Variables {
  readonly all: Record<string, string>;

  constructor(all: Record<string, string>) {
    this.all = Object.freeze({
      ...all,
    });
  }

  get(key: string, ctx?: Context): string | undefined {
    const parent = ctx?.parent;
    const result = this.all[key];
    if (result === undefined && parent !== undefined) {
      return parent.variables.get(key, parent);
    }
    return result;
  }
}

export function evaluate(input: string, ctx: Context): string {
  const vars = ctx.variables;
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
    return vars.get(varname, ctx) || defval || "";
  };

  return input.replaceAll(VARDEF_PTN, replacer);
}

export class DuplicateVariableError extends ErrBase {
  readonly variable: string;

  constructor(variable: string, msg = "duplicate variable") {
    super(msg, { variable });
    this.variable = variable;
  }
}
