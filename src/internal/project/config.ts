import { z } from "zod";

import { TaskConfig, parse as parseTask, schema as taskSchema } from "../task/config.ts";

const defaultsSchema = z.object({
  task: z.string().optional(),
});

const schema = z.object({
  root: z.boolean().optional(),
  defaults: defaultsSchema.optional(),
  tasks: z.record(
    z.string(),
    taskSchema.optional(),
  ).optional().transform((tasks) => {
    const result: Record<string, TaskConfig> = {};

    for (const [name, config] of Object.entries(tasks || {})) {
      result[name] = parseTask(name, config);
    }

    return result;
  }),
});

export const DEFAULTS: Partial<ProjectConfig> = {
  root: false,
  defaults: {
    task: ":default",
  },
  tasks: {},
};

export interface ProjectConfig extends z.infer<typeof schema> {
  readonly path: string;
}

export function parse(path: string, data: unknown): ProjectConfig {
  const parsed = schema.parse(data);
  const config = {
    path,
    defaults: {
      ...DEFAULTS.defaults,
      ...parsed.defaults,
    },
    root: parsed.root ?? DEFAULTS.root,
    tasks: parsed.tasks,
  }

  return config;
}
