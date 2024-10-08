/** */

import { z } from "zod";

import { RecordSchema as TaskRecordSchema } from "../task/config.ts";

export const Schema = z.object({
  root: z.boolean().optional().default(false),
  tasks: TaskRecordSchema.optional().default({}),
});

export interface Config extends z.infer<typeof Schema> {
  readonly path: string;
  readonly parent?: string;
}

export function from(path: string, input: unknown): Config {
  const parsed = Schema.parse(input);
  return {
    ...parsed,
    path,
  };
}
