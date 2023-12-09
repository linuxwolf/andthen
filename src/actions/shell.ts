/** */

import { z } from "zod";

import { BaseActionSchema, Action } from "./base.ts";
import { VariablesContext } from "../vars.ts";

export const ShellActionSchema = BaseActionSchema.extend({
  shell: z.string(),
  exec: z.string().optional(),
  vars: z.record(z.string()).optional(),
});

export type ShellActionConfig = z.infer<typeof ShellActionSchema>;

export class ShellAction extends Action implements VariablesContext {
  readonly shell: string;
  readonly exec: string;

  constructor(cfg: ShellActionConfig) {
    super(cfg);

    this.shell = cfg.shell;
    this.exec = cfg.exec ?? "";
  }

  get type(): string {
    return "shell";
  }

  toConfig(): ShellActionConfig {
    const shell = this.shell;

    return {
      shell,
      ...(this.exec && { exec: this.exec }),
      ...super.toConfig(),
    };
  }
}
