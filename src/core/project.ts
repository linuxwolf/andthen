import { path } from "../deps.ts";
import { Target, TargetConfig } from "./target.ts";
import { Context, VariableBuiler, Variables } from "./vars.ts";
import { checkName } from "../util/naming.ts";
import * as errors from "../errors/mod.ts";

export interface ProjectConfig {
  readonly filepath: string;
  readonly root?: boolean;
  readonly default?: string;
  readonly variables?: Record<string, string>;
  readonly targets?: TargetConfig[];
}

export class Project implements Context {
  readonly name: string;
  readonly filepath: string;
  readonly path: string;
  readonly root: boolean;
  readonly default: string;
  readonly parent?: Project;
  readonly variables: Variables;
  readonly targets: Record<string, TargetConfig>;

  constructor(cfg: ProjectConfig, parent?: Project) {
    this.filepath = cfg.filepath;
    this.name = path.basename(this.filepath);
    this.parent = parent;
    this.root = (cfg.root !== undefined) ? cfg.root : (!this.parent);
    this.default = cfg.default || "";
    this.variables = cfg.variables || {};

    if (this.root) {
      this.path = "//";
    } else {
      const prefix = this.parent?.path || ".";
      const sep = prefix.endsWith("/") ? "" : "/";
      this.path = `${prefix}${sep}${this.name}`;
    }

    const targets = (cfg.targets || []).reduce((acc, cfg) => {
      acc[cfg.name] = cfg;
      return acc;
    }, {} as Record<string, TargetConfig>);
    this.targets = Object.freeze(targets);
  }

  // deno-lint-ignore require-await
  async resolve(name: string): Promise<Target> {
    name = this.targetName(name);

    const cfg = this.targets[name];
    if (!cfg) throw new errors.TargetNotFound(name);
    // TODO: resolve template (if any)
    const result = new Target(this, cfg);

    return Promise.resolve(result);
  }

  targetName(name: string): string {
    if (name === "default") {
      name = this.default || Object.keys(this.targets)[0] || name;
    }
    return name;
  }
}

export class ProjectBuilder implements ProjectConfig, VariableBuiler {
  readonly filepath: string;

  private _root = false;
  private _default = "default";
  private _vars: Record<string, string> = {};
  private _targets: Map<string, TargetConfig> = new Map();

  constructor(path: string);
  constructor(cfg: ProjectConfig);
  constructor(pathOrCfg: ProjectConfig | string) {
    const cfg = (typeof pathOrCfg === "string")
      ? { filepath: pathOrCfg }
      : pathOrCfg;
    this.filepath = cfg.filepath;
    this._root = cfg.root || false;
    this._default = cfg.default || "default";
    this._vars = cfg.variables || {};
    for (const t of cfg.targets || []) {
      this._targets.set(t.name, t);
    }
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
