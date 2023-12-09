/** */

import { Variables, VariablesContext } from "../vars.ts";
import { Action, ActionConfig } from "./base.ts";

export interface TaskActionConfig extends ActionConfig {
  readonly task: string;
  readonly vars?: Variables;
}

export class TaskAction extends Action implements VariablesContext {
  readonly task: string;

  #vars: Variables;

  constructor(cfg: TaskActionConfig) {
    super(cfg);
    this.#vars = { ...cfg.vars };
    this.task = cfg.task;
  }

  get type() {
    return "task";
  }

  get vars() {
    return { ...this.#vars };
  }

  toConfig(): TaskActionConfig {
    const vars = this.vars;

    return {
      type: "task",
      task: this.task,
      ...((Object.entries(vars).length > 0) && { vars }),
    };
  }
}
