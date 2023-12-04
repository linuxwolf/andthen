/** */

import { Variables } from "../vars.ts";

export interface ActionRef {
  type: string;
  vars?: Variables;
}

export interface ShellActionRef extends ActionRef {
  cmd: string;
  exec?: string;
}

export interface TaskConfig {
  readonly name: string;
  readonly desc?: string;
  readonly internal?: boolean;
  readonly vars?: Variables;
  readonly deps?: string[];
  readonly steps?: ActionRef[];
}
