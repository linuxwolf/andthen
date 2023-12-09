/** */

import { Action, ActionConfig } from "./base.ts";

export interface ShellActionConfig extends ActionConfig {
  readonly cmd: string;
  readonly exec?: string;
}

export class ShellAction extends Action {
  readonly cmd: string;
  readonly exec: string;

  constructor(cfg: ShellActionConfig) {
    super(cfg);

    this.cmd = cfg.cmd;
    this.exec = cfg.exec ?? "";
  }

  get type() {
    return "shell";
  }

  toConfig(): ShellActionConfig {
    return {
      type: this.type,
      cmd: this.cmd,
      ...(this.exec && { exec: this.exec }),
    };
  }
}
