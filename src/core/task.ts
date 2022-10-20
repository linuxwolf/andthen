import { checkName as checkName } from "../util/naming.ts";
import { VariableContext } from "../util/vars.ts";

export interface TaskConfig {
  readonly name: string;
  readonly description?: string;
  readonly dependencies?: string[];
  readonly variables?: VariableContext;
}

export class Task implements TaskConfig {
  readonly name: string;
  readonly description: string;
  readonly dependencies: string[];
  readonly variables?: VariableContext;

  constructor(cfg: TaskConfig) {
    this.name = checkName(cfg.name);
    this.description = cfg.description || "";
    this.dependencies = [...cfg.dependencies || []];
    this.variables = new VariableContext(cfg.variables?.all() || {});
  }
}
