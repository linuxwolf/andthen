/** */

import { z } from "zod";

import { ActionSchema, asConfig as asActionConfig } from "../actions/config.ts";

export const TaskSchema = z.object({
  desc: z.string().optional(),
  internal: z.boolean().optional(),
  vars: z.record(z.string()).optional(),
  deps: z.string().array().optional(),
  steps: ActionSchema.array().transform((val) => (
    val.map((s) => asActionConfig(s))
  )).optional(),
});

export interface TaskConfig extends z.infer<typeof TaskSchema> {
  readonly name: string;
}

export function asConfig(name: string, input: unknown): TaskConfig {
  const data = TaskSchema.parse(input);

  return {
    name,
    ...data,
  };
}
