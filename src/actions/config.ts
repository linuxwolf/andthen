/** */

import { z } from "zod";

import { ShellActionConfig, ShellActionSchema } from "./shell.ts";
import { TaskActionConfig, TaskActionSchema } from "./task.ts";

export type ActionConfig = (ShellActionConfig | TaskActionConfig);

export const Schema = z.union([
  ShellActionSchema,
  TaskActionSchema,
]);
