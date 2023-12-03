/** */

import { TaskConfig } from "../tasks/config.ts";
import { VariablesContext } from "../vars.ts";

export interface ProjectConfig extends VariablesContext {
  readonly parent?: ProjectConfig;
  readonly name: string;
  readonly default?: string;
  readonly root?: boolean;
  readonly tasks?: Record<string, TaskConfig>;
}
