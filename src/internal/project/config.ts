import { deepMerge } from "@std/collections";
import { z } from "zod";

const taskNameSchema = z.string().startsWith(":");

const taskSchema = z.object({});

const defaultsSchema = z.object({
  task: taskNameSchema.optional(),
});

const schema = z.object({
  root: z.boolean().optional(),
  defaults: defaultsSchema.optional(),
  tasks: z.record(
    taskNameSchema,
    taskSchema.optional(),
  ).optional(),
});

export const DEFAULTS: Partial<ProjectConfig> = {
  root: false,
  defaults: {
    task: ":default",
  },
};

export interface ProjectConfig extends z.infer<typeof schema> {
  path: string;
}

export function parse(path: string, data: unknown): ProjectConfig {
  const parsed = schema.parse(data);

  const config = deepMerge(DEFAULTS, parsed);

  return {
    ...config,
    path,
  };
}
