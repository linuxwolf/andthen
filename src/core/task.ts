import { ErrBase } from "../util/errs.ts";
import { checkName as checkName } from "../util/naming.ts";
import { Project } from "./project.ts";
import { Context, DuplicateVariableError, Variables } from "./vars.ts";

export interface TaskConfig {
  readonly name: string;
  readonly description?: string;
  readonly dependencies?: string[];
  readonly variables?: Record<string, string>;
}

export class Task implements Context {
  readonly parent: Project;
  readonly name: string;
  readonly description: string;
  readonly dependencies: string[];
  readonly variables: Variables;

  constructor(parent: Project, cfg: TaskConfig) {
    this.name = checkName(cfg.name);
    this.parent = parent;
    this.description = cfg.description || "";
    this.dependencies = (cfg.dependencies || []).slice();
    this.variables = new Variables(cfg.variables || {});
  }
}

export class TaskBuilder implements TaskConfig {
  readonly name: string;

  private _desc = "";
  private _deps: string[] = [];
  private _vars: Record<string, string> = {};

  constructor(name: string) {
    this.name = checkName(name);
  }

  get description(): string { return this._desc; }
  withDescription(desc: string): TaskBuilder {
    this._desc = desc;
    return this;
  }

  get dependencies(): string[] { return [...this._deps]; }
  dependsOn(...deps: string[]): TaskBuilder {
    const all = new Set(this._deps);
    for (const d of deps) {
      all.add(d);
    }
    this._deps = [ ...all.values() ];
    return this;
  }

  get variables(): Record<string, string> { return { ...this._vars }; }
  withVariable(key: string, val: string): TaskBuilder {
    if (key in this._vars) { throw new DuplicateVariableError(key); }

    this._vars[key] = val;
    return this;
  }

  build(parent: Project): Task {
    return new Task(parent, this);
  }
}

export class DuplicateTaskError  extends ErrBase {
  readonly task: string;

  constructor(task: string, msg = "duplicate task") {
    super(msg, { task });
    this.task = task;
  }
}
