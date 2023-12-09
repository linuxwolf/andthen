/** */

import { z } from "zod";

import { Action, BaseActionSchema } from "./base.ts";
import { VariablesContext } from "../vars.ts";

export const TaskActionSchema = BaseActionSchema.extend({
  task: z.string(),
  vars: z.record(z.string()).optional(),
});
export type TaskActionConfig = z.infer<typeof TaskActionSchema>;

export class TaskAction extends Action implements VariablesContext {
  readonly task: string;

  constructor(cfg: TaskActionConfig) {
    super(cfg);
    this.task = cfg.task;
  }

  get type() {
    return "task";
  }

  toConfig(): TaskActionConfig {
    return {
      task: this.task,
      ...super.toConfig(),
    };
  }
}
