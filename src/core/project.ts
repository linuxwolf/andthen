import { DuplicateTaskError, Task, TaskConfig } from "./task.ts";
import { Context, Variables } from "./vars.ts";
import { checkName } from "../util/naming.ts";

export interface ProjectConfig {
  readonly path: string;
  readonly variables?: Record<string, string>;
  readonly tasks?: Record<string, TaskConfig>;
}

export class Project implements Context {
  readonly parent?: Project;
  readonly path: string;
  readonly variables: Variables;
  readonly tasks: Record<string, Task>;

  constructor(cfg: ProjectConfig, parent?: Project) {
    this.path = checkName(cfg.path);
    this.parent = parent;
    this.variables = new Variables(cfg.variables || {});

    const tasks = Object.entries(cfg.tasks || {}).reduce((acc, [name, cfg]) => {
      acc[name] = new Task(this, cfg);
      return acc;
    }, {} as Record<string, Task>);
    this.tasks = Object.freeze(tasks);
  }
}

export class ProjectBuilder implements ProjectConfig {
  readonly path: string;

  private _vars: Record<string, string> = {};
  private _tasks: Record<string, TaskConfig> = {};

  constructor(path: string) {
    this.path = path;
  }

  get variables(): Record<string, string> { return { ...this._vars }; }
  withVariable(key: string, val: string): ProjectBuilder {
    this._vars[key] = val;
    return this;
  }

  get tasks(): Record<string, TaskConfig> { return { ...this._tasks }; }
  withTask(task: TaskConfig): ProjectBuilder {
    if (task.name in this._tasks)  {
      throw new DuplicateTaskError(task.name);
    }
    this._tasks[task.name] = task;
    return this;
  }

  build(parent?: Project): Project {
    return new Project(this, parent);
  }
}
