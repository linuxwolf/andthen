/** */

import { z } from "zod";

import { Action, BaseActionSchema } from "./base.ts";
import { VariablesContext } from "../vars.ts";

export const TaskActionSchema = BaseActionSchema.extend({
  type: z.literal("task"),
  path: z.string(),
  vars: z.record(z.string()).optional(),
});
export type TaskActionConfig = z.infer<typeof TaskActionSchema>;

export class TaskAction extends Action implements VariablesContext {
  readonly path: string;

  constructor(cfg: TaskActionConfig) {
    super(cfg);
    this.path = cfg.path;
  }

  get type() {
    return "task";
  }

  toConfig(): TaskActionConfig {
    return {
      type: "task",
      path: this.path,
      ...super.toConfig(),
    };
  }
}
