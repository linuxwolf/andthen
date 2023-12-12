/** */

import { z } from "zod";

import { ShellActionConfig, ShellActionSchema } from "./shell.ts";
import { TaskActionConfig, TaskActionSchema } from "./task.ts";

export type ActionConfig = ShellActionConfig | TaskActionConfig;

export const ActionSchema = z.union([
  z.discriminatedUnion("type", [
    ShellActionSchema,
    TaskActionSchema,
  ]),
  z.string().transform((cmd) => ({
    type: "shell",
    cmd,
  } as ShellActionConfig)),
]);

export function asConfig(input: unknown): ActionConfig {
  return ActionSchema.parse(input);
}
