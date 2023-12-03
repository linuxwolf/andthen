/** */

import { TaskConfig } from "../tasks/config.ts";
import { Variables } from "../vars.ts";

export interface ProjectConfig {
  readonly name: string;
  readonly default?: string;
  readonly root?: boolean;
  readonly vars?: Variables;
  readonly tasks?: TaskConfig[];
}
