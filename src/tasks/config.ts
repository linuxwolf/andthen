/** */

import { z } from "zod";

import {
  ActionConfig,
  asConfig as asActionConfig,
  Schema as ActionSchema,
} from "../actions/config.ts";
import { Variables } from "../vars.ts";

export const Schema = z.object({
  desc: z.string().optional(),
  internal: z.boolean().optional(),
  vars: z.record(z.string()).optional(),
  deps: z.string().array().optional(),
  steps: ActionSchema.array().transform((val) => (
    val.map((s) => asActionConfig(s))
  )).optional(),
});

export interface TaskConfig {
  readonly name: string;
  readonly desc?: string;
  readonly internal?: boolean;
  readonly vars?: Variables;
  readonly deps?: string[];
  readonly steps?: ActionConfig[];
}

export function asConfig(name: string, input: unknown): TaskConfig {
  const data = Schema.parse(input);

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
