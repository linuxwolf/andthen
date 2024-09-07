/** */

import { z } from "zod";

export const Schema = z.object({
  desc: z.string().optional().default(""),
  internal: z.boolean().optional().default(false),
});

export interface Config extends z.infer<typeof Schema> {
  readonly name: string;
}

export function from(name: string, input: unknown): Config {
  return {
    ...Schema.parse(input),
    name,
  };
}

export const RecordSchema = z.record(
  z.string().startsWith(":").min(2),
  Schema,
).transform((tasks) =>
  Object.fromEntries(
    Object.entries(tasks).map(([name, input]) => [name, from(name, input)]),
  )
);
