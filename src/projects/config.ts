/** */

import { z } from "zod";

import { asConfig as asTaskConfig, TaskSchema } from "../tasks/config.ts";
import { ActionSchema } from "../actions/config.ts";

const TaskShortSchema = z.union([
  TaskSchema,
  ActionSchema.array().transform((steps) => ({
    steps,
  } as z.infer<typeof TaskSchema>)),
]);

export const ProjectSchema = z.object({
  desc: z.string().optional(),
  root: z.boolean().optional(),
  vars: z.record(z.string()).optional(),
  tasks: z.record(TaskShortSchema).transform((val) => (
    Object.entries(val).map(([name, task]) => asTaskConfig(name, task))
  )).optional(),
});

export interface ProjectConfig extends z.infer<typeof ProjectSchema> {
  readonly path: string;
}

export function asConfig(path: string, input: unknown): ProjectConfig {
  const data = ProjectSchema.parse(input);

  return {
    path,
    ...data,
  };
}
