import { deepMerge } from "@std/collections";
import { z } from "zod";
import { InvalidTaskNameError } from "../errors.ts";

const NAME_PATTERN = /^:[^\s]+$/;

export const taskNameSchema = z.string().regex(NAME_PATTERN);

export const schema = z.object({
  desc: z.string().optional(),
  deps: z.array(z.string()).optional(),
});

export const DEFAULTS: Partial<TaskConfig> = {
  desc: "",
  deps: [],
};

export interface TaskConfig extends z.infer<typeof schema> {
  readonly name: string;
}

export function parse(name: string, data: unknown): TaskConfig {
  if (!NAME_PATTERN.test(name)) {
    throw new InvalidTaskNameError(name);
  }

  const parsed = schema.parse(data);
  const config = deepMerge(DEFAULTS, parsed);

  return {
    ...config,
    name,
  };
}
