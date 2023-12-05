/** */

import { Action, ActionConfig } from "./base.ts";

export interface TaskActionConfig extends ActionConfig {
  readonly task: string;
}

export class TaskAction extends Action {
  readonly task: string;

  constructor(cfg: TaskActionConfig) {
    super(cfg);
    this.task = cfg.task;
  }

  get type() {
    return "task";
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
