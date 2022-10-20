import { checkName as checkName } from "../util/naming.ts";
import { Context, Variables } from "./vars.ts";

export interface TaskConfig {
  readonly name: string;
  readonly description?: string;
  readonly dependencies?: string[];
  readonly variables?: Record<string, string>;
}

export class Task implements Context {
  readonly name: string;
  readonly description: string;
  readonly dependencies: string[];
  readonly variables: Variables;

  constructor(cfg: TaskConfig) {
    this.name = checkName(cfg.name);
    this.description = cfg.description || "";
    this.dependencies = [...cfg.dependencies || []];
    this.variables = new Variables(cfg.variables || {});
  }
}
