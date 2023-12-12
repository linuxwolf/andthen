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

  // extract simple fields
  const {
    desc,
    internal,
    vars,
    deps,
    steps,
  } = data;

  return {
    name,
    ...(desc && { desc }),
    ...(internal && { internal }),
    ...((Object.entries(vars || {}).length > 0) && { vars }),
    ...(((deps || []).length > 0) && { deps }),
    ...(((steps || []).length > 0) && { steps }),
  } as TaskConfig;
}
