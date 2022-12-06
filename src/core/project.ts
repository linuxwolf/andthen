import { Target, TargetConfig } from "./target.ts";
import { Context, VariableBuiler, Variables } from "./vars.ts";
import { checkName } from "../util/naming.ts";
import * as errors from "../errors/mod.ts";

export interface ProjectConfig {
  readonly path: string;
  readonly root?: boolean;
  readonly default?: string;
  readonly variables?: Record<string, string>;
  readonly targets?: TargetConfig[];
}

export class Project implements Context {
  readonly path: string;
  readonly root: boolean;
  readonly default: string;
  readonly parent?: Project;
  readonly variables: Variables;
  readonly targets: Record<string, Target>;

  constructor(cfg: ProjectConfig, parent?: Project) {
    this.path = checkName(cfg.path);
    this.parent = parent;
    this.root = (cfg.root !== undefined) ? cfg.root : false;
    this.default = cfg.default || "default";
    this.variables = cfg.variables || {};

    const targets = (cfg.targets || []).reduce((acc, cfg) => {
      acc[cfg.name] = new Target(this, cfg);
      return acc;
    }, {} as Record<string, Target>);
    this.targets = Object.freeze(targets);
  }
}

export class ProjectBuilder implements ProjectConfig, VariableBuiler {
  readonly path: string;

  private _root = false;
  private _default = "default";
  private _vars: Record<string, string> = {};
  private _targets: Map<string, TargetConfig> = new Map();

  constructor(path: string) {
    this.path = path;
  }

  get root(): boolean {
    return this._root;
  }
  asRoot(root = true): ProjectBuilder {
    this._root = root;
    return this;
  }

  get default(): string {
    return this._default;
  }
  withDefault(target: string): ProjectBuilder {
    this._default = checkName(target);
    return this;
  }

  get variables(): Record<string, string> {
    return { ...this._vars };
  }
  withVariable(key: string, val: string): ProjectBuilder {
    if (key in this._vars) throw new errors.DuplicateVariable(key);

    this._vars[key] = val;
    return this;
  }

  get targets(): TargetConfig[] {
    return [...this._targets.values()];
  }
  withTarget(target: TargetConfig): ProjectBuilder {
    if (this._targets.has(target.name)) {
      throw new errors.DuplicateTarget(target.name);
    }
    this._targets.set(target.name, target);
    return this;
  }

  build(parent?: Project): Project {
    return new Project(this, parent);
  }
}
