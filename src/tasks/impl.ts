/** */

import { Variables, VariablesContext } from "../vars.ts";
import { TaskConfig } from "./config.ts";
import { ActionConfig } from "../actions/config.ts";

export class Task implements VariablesContext {
  readonly name: string;
  readonly desc: string;
  readonly internal: boolean;
  readonly parent?: VariablesContext;

  #vars: Variables;
  #deps: string[];
  #steps: ActionConfig[];

  constructor(cfg: TaskConfig, parent?: VariablesContext) {
    this.parent = parent;
    this.name = cfg.name;
    this.desc = cfg.desc ?? "";
    this.internal = cfg.internal ?? false;
    this.#vars = { ...(cfg.vars ?? {}) };
    this.#deps = [...(cfg.deps ?? [])];
    this.#steps = [...(cfg.steps ?? [])];
  }

  get vars() {
    return { ...this.#vars };
  }
  get deps() {
    return [...this.#deps];
  }
  get steps() {
    return [...this.#steps];
  }

  toConfig(): TaskConfig {
    const vars = this.vars;
    const deps = this.deps;
    const steps = this.steps;

    return {
      name: this.name,
      ...((this.desc !== "") && { desc: this.desc }),
      ...(this.internal && { internal: this.internal }),
      ...((Object.entries(vars).length > 0) && { vars }),
      ...((deps.length > 0) && { deps }),
      ...((steps.length > 0) && { steps }),
    };
  }
}
