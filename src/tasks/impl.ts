/** */

import { Variables, VariablesContext } from "../vars.ts";
import { ActionRef, TaskConfig, TaskRef } from "./config.ts";

export class Task {
  readonly name: string;
  readonly desc: string;
  readonly internal: boolean;
  readonly parent?: VariablesContext;

  #vars: Variables;
  #deps: TaskRef[];
  #steps: ActionRef[];

  constructor(cfg: TaskConfig, parent?: VariablesContext) {
    this.parent = parent ?? cfg.parent;
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
    return {
      name: this.name,
      ...(this.parent && { parent: this.parent }),
      ...(this.internal && { internal: this.internal }),
      ...((this.desc !== "") && { desc: this.desc }),
      ...((Object.entries(this.vars).length > 0) && { vars: this.vars }),
      ...((this.deps.length > 0) && { deps: this.deps }),
      ...((this.steps.length > 0) && { steps: this.steps }),
    };
  }
}
