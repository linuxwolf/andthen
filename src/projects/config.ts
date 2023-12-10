/** */

import { z } from "zod";

import { asConfig as asTaskConfig, TaskSchema } from "../tasks/config.ts";

export const ProjectSchema = z.object({
  root: z.boolean().optional(),
  vars: z.record(z.string()).optional(),
  tasks: z.record(TaskSchema).transform((val) => (
    Object.entries(val).map(([name, task]) => asTaskConfig(name, task))
  )).optional(),
});

export interface ProjectConfig extends z.infer<typeof ProjectSchema> {
  readonly name: string;
}

export function asConfig(name: string, input: unknown): ProjectConfig {
  const data = ProjectSchema.parse(input);

  const {
    root,
    vars,
    tasks,
  } = data;

  return {
    name,
    ...(root && { root }),
    ...((Object.entries(vars || {}).length > 0) && { vars }),
    ...(((tasks || []).length > 0) && { tasks }),
  };
}
