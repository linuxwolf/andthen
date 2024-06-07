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

export const DEFAULTS: ProjectConfig = {
  root: false,
  defaults: {
    task: ":default",
  },
};

export type ProjectConfig = z.infer<typeof schema>;

export function parse(data: unknown): ProjectConfig {
  const parsed = schema.parse(data);

  return deepMerge(DEFAULTS, parsed);
}
