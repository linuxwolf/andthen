/** */

import { z } from "zod";

import { Action, BaseActionSchema } from "./base.ts";
import { VariablesContext } from "../vars.ts";

export const ShellActionSchema = BaseActionSchema.extend({
  type: z.literal("shell"),
  cmd: z.string(),
  exec: z.string().optional(),
  vars: z.record(z.string()).optional(),
});

export type ShellActionConfig = z.infer<typeof ShellActionSchema>;

export class ShellAction extends Action implements VariablesContext {
  readonly cmd: string;
  readonly exec: string;

  constructor(cfg: ShellActionConfig) {
    super(cfg);

    this.cmd = cfg.cmd;
    this.exec = cfg.exec ?? "";
  }

  get type(): string {
    return "shell";
  }

  toConfig(): ShellActionConfig {
    const cmd = this.cmd;

    return {
      type: "shell",
      cmd,
      ...(this.exec && { exec: this.exec }),
      ...super.toConfig(),
    };
  }
}
