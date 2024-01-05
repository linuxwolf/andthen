/** */

import { Variables, VariablesContext } from "../vars.ts";
import { TaskConfig } from "./config.ts";
import { ActionConfig } from "../actions/config.ts";
import { Project } from "../projects/impl.ts";
import { TaskPath } from "./path.ts";

export class Task implements VariablesContext {
  readonly name: string;
  readonly desc: string;
  readonly internal: boolean;
  readonly parent?: Project;

  #path: TaskPath;
  #vars: Variables;
  #deps: string[];
  #steps: ActionConfig[];

  constructor(cfg: TaskConfig, parent?: Project) {
    this.parent = parent;
    this.name = cfg.name;
    this.desc = cfg.desc ?? "";
    this.internal = cfg.internal ?? false;
    this.#vars = { ...(cfg.vars ?? {}) };
    this.#deps = [...(cfg.deps ?? [])];
    this.#steps = [...(cfg.steps ?? [])];

    // calculate task path
    this.#path = TaskPath.from(":" + this.name);
    if (this.parent) {
      this.#path = this.#path.resolveFrom(this.parent.taskPath);
    }
  }

  get taskPath() {
    return this.#path;
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
