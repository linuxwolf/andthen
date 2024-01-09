/** */

import { z } from "zod";

import { Action, ActionResult, ActionState, BaseActionSchema } from "./base.ts";
import { resolve, Variables, VariablesContext } from "../vars.ts";
import log from "../logging.ts";
import { ShellActionFailed } from "../errors.ts";

export const _internals = {
  env: Deno.env,
  Command: Deno.Command,
};

export const ShellActionSchema = BaseActionSchema.extend({
  type: z.literal("shell"),
  cmd: z.string(),
  exec: z.string().optional(),
  exports: z.string().optional(),
});

export type ShellActionConfig = z.infer<typeof ShellActionSchema>;

export class ShellAction extends Action implements VariablesContext {
  readonly cmd: string;
  readonly exec: string;
  readonly exports?: string;

  constructor(cfg: ShellActionConfig) {
    super(cfg);

    this.cmd = cfg.cmd;
    this.exec = cfg.exec ?? "";
  }

  get type(): string {
    return "shell";
  }

  async run(state: ActionState): Promise<ActionResult> {
    const exec = this.exec || _internals.env.get("SHELL") || "sh";
    const args = [
      "-euo",
      "pipefail",
      "-c",
      this.cmd,
    ];

    // apply any vars to envs
    let { env } = state;
    env = resolve(this.vars, env);

    const {
      cwd,
    } = state;

    // runnit!
    let result: Deno.CommandOutput;
    try {
      const cmd = new _internals.Command(exec, {
        args,
        cwd,
        env,
        clearEnv: true,
      });

      result = await cmd.output();
    } catch (e) {
      throw new ShellActionFailed(this.cmd, -1, e);
    }

    if (result.stderr.length > 0) {
      // always log stderr
      const stderr = new TextDecoder().decode(result.stderr).trim();
      log.warn(stderr);
    }

    const stdout = new TextDecoder().decode(result.stdout).trim();
    if (stdout) {
      // log if not empty
      log.info(stdout);
    }

    // deal with exported value
    const exported: Variables = {};
    if (this.exports) {
      exported[this.exports] = stdout;
    }

    if (!result.success) {
      throw new ShellActionFailed(this.cmd, result.code);
    }

    return {
      exported,
    };
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
