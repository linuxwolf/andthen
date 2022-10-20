import { ErrBase } from "./errs.ts";

const VARDEF_PTN = /(\$\$)|\${([_a-zA-Z][_a-zA-Z0-9]*)(?:(?:\:=)([\s\S]*))?}/g;

export class TerminalContextError extends ErrBase {
  constructor(msg = "terminal variable context") {
    super(msg);
  }
}

export type Mapping = Map<string, string> | Record<string, string>;

export class VariableContext {
  readonly parent?: VariableContext;

  protected _mapping = new Map<string, string>();

  constructor(vars: Mapping, parent?: VariableContext) {
    this.parent = parent;
    if (vars) {
      this.apply(vars);
    }
  }

  all(): Record<string, string> {
    const result: Mapping = {};

    for (const [key, value] of this._mapping.entries()) {
      result[key] = value;
    }

    return result;
  }

  get(key: string): string | undefined {
    const result = this._mapping.get(key);
    if (result === undefined) {
      return this.parent?.get(key);
    }
    return result;
  }

  private apply(vars: Mapping) {
    const mapping = (vars instanceof Map)
      ? vars.entries()
      : Object.entries(vars);
    for (const [key, value] of mapping) {
      this._mapping.set(key, value);
    }
  }

  push(vars: Map<string, string>): VariableContext;
  push(vars: Record<string, string>): VariableContext;
  push(vars: Mapping): VariableContext {
    return new VariableContext(vars, this);
  }

  pop(): VariableContext {
    if (!this.parent) {
      throw new TerminalContextError();
    }
    return this.parent;
  }

  evaluate(input: string): string {
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
      return this.get(varname) || defval || "";
    };

    return input.replaceAll(VARDEF_PTN, replacer);
  }
}

export class MutableVariableContext extends VariableContext {
  constructor(mapping: Mapping, parent?: VariableContext) {
    super(mapping, parent);
  }

  set(key: string, val: string) {
    this._mapping.set(key, val);
  }
  del(key: string) {
    this._mapping.delete(key);
  }

  asImmutable(): VariableContext {
    return new VariableContext(this._mapping, this.parent);
  }
}
