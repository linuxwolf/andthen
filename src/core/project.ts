import { DuplicateTargetError, Target, TargetConfig } from "./target.ts";
import { Context, DuplicateVariableError, VariableBuiler, Variables } from "./vars.ts";
import { checkName } from "../util/naming.ts";

export interface ProjectConfig {
  readonly path: string;
  readonly variables?: Record<string, string>;
  readonly tasks?: TargetConfig[];
}

export class Project implements Context {
  readonly parent?: Project;
  readonly path: string;
  readonly variables: Variables;
  readonly tasks: Record<string, Target>;

  constructor(cfg: ProjectConfig, parent?: Project) {
    this.path = checkName(cfg.path);
    this.parent = parent;
    this.variables = new Variables(cfg.variables || {});

    const tasks = (cfg.tasks || []).reduce((acc, cfg) => {
      acc[cfg.name] = new Target(this, cfg);
      return acc;
    }, {} as Record<string, Target>);
    this.tasks = Object.freeze(tasks);
  }
}

export class ProjectBuilder implements ProjectConfig, VariableBuiler {
  readonly path: string;

  private _vars: Record<string, string> = {};
  private _tasks: Map<string, TargetConfig> = new Map();

  constructor(path: string) {
    this.path = path;
  }

  get variables(): Record<string, string> {
    return { ...this._vars };
  }
  withVariable(key: string, val: string): ProjectBuilder {
    if (key in this._vars) throw new DuplicateVariableError(key);

    this._vars[key] = val;
    return this;
  }

  get tasks(): TargetConfig[] {
    return [...this._tasks.values()];
  }
  withTarget(task: TargetConfig): ProjectBuilder {
    if (this._tasks.has(task.name)) {
      throw new DuplicateTargetError(task.name);
    }
    this._tasks.set(task.name, task);
    return this;
  }

  build(parent?: Project): Project {
    return new Project(this, parent);
  }
}
