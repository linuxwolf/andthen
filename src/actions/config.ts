/** */

import { z } from "zod";

import { ShellActionConfig, ShellActionSchema } from "./shell.ts";
import { TaskActionConfig, TaskActionSchema } from "./task.ts";

export type ActionConfig = ShellActionConfig | TaskActionConfig;

export const Schema = z.union([
  z.discriminatedUnion("type", [
    ShellActionSchema,
    TaskActionSchema
  ]),
  z.string(),
]);

export function asConfig(input: unknown): ActionConfig {
  const result = Schema.parse(input);
  if (typeof result === "string") {
    // short-syntax shell
    return {
      type: "shell",
      cmd: result,
    };
  }

  return result;
}
