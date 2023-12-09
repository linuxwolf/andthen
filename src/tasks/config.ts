/** */

import { ActionConfig } from "../actions/config.ts";
import { Variables } from "../vars.ts";

export interface TaskConfig {
  readonly name: string;
  readonly desc?: string;
  readonly internal?: boolean;
  readonly vars?: Variables;
  readonly deps?: string[];
  readonly steps?: ActionConfig[];
}
