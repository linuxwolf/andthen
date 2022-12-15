import { path } from "../deps.ts";
import { Optional } from "../util/types.ts";
import { checkName as checkName } from "../util/naming.ts";
import { Project } from "./project.ts";
import { Context, VariableBuiler, Variables } from "./vars.ts";
import * as errors from "../errors/mod.ts";

const { posix } = path;

function stripSeparator(input: string): string {
  if (input.startsWith("/")) { input = input.substring(1); }
  if (input.endsWith("/")) { input = input.substring(0, input.length - 1); }

  return input;
}

export enum TargetPathType {
  Relative = "relative",
  Root = "root",
  Absolute = "absolute",
}

export class TargetPath {
  readonly type: TargetPathType;
  readonly path: string;
  readonly target: string;

  constructor(input: string) {
    const posix = path.posix;

    let prefix: string;
    let type: TargetPathType;

    if (input.startsWith("//")) {
      type = TargetPathType.Root;
      prefix = "//";
      input = input.substring(2);
    } else if (input.startsWith("/")) {
      type = TargetPathType.Absolute;
      prefix = "/";
      input = input.substring(1);
    } else if (input.startsWith("./")) {
      type = TargetPathType.Relative;
      prefix = "./";
      input = input.substring(1);
    } else if (input.startsWith("../")) {
      type = TargetPathType.Relative;
      prefix = "../";
      input = input.substring(3);
    } else {
      type = TargetPathType.Relative;
      prefix = "./";
      input = (input && ":" + input) || "";
    }

    input = posix.normalize(input);
    let parent = posix.dirname(input);
    parent = stripSeparator(parent);

    let [ dir, target ] = posix.basename(input).split(":", 2);
    // explicit target default
    if (!target) {
      target = "default";
    }

    // combine and normalize
    dir = posix.join(parent, dir);
    dir = stripSeparator(dir);
    if (dir === ".") { dir = ""; }

    this.type = type;
    this.path = prefix + dir;
    this.target = target;
  }

  toString(): string {
    return `${this.path}:${this.target}`;
  }

  relativeTo(base: TargetPath): TargetPath {
    if (this.type === TargetPathType.Root || this.type === TargetPathType.Absolute) {
      return this;
    }

    return new TargetPath(`${base.path}/${this.path}:${this.target}`);
  }
}

export interface TargetConfig {
  readonly name: string;
  readonly description?: string;
  readonly dependencies?: string[];
  readonly variables?: Record<string, string>;
  readonly action?: string;
  readonly output?: string;
}

export class Target implements Context {
  readonly parent: Project;
  readonly name: string;
  readonly path: string;
  readonly description: string;
  readonly dependencies: string[];
  readonly variables: Variables;
  readonly action: string;
  readonly output: string;

  constructor(parent: Project, cfg: TargetConfig) {
    this.name = checkName(cfg.name);
    this.parent = parent;
    this.path = `${parent.path}:${this.name}`;
    this.description = cfg.description || "";
    this.dependencies = (cfg.dependencies || []).slice();
    this.variables = cfg.variables || {};
    this.action = cfg.action || "";
    this.output = cfg.output || "";
  }
}

export class TargetBuilder implements TargetConfig, VariableBuiler {
  readonly name: string;

  private _desc = "";
  private _deps: string[] = [];
  private _vars: Record<string, string> = {};
  private _act = "";
  private _out = "";

  constructor(name: string);
  constructor(cfg: TargetConfig);
  constructor(nameOrCfg: string | TargetConfig) {
    const cfg = (typeof nameOrCfg === "string")
      ? {
        name: nameOrCfg,
      }
      : nameOrCfg;
    this.name = checkName(cfg.name);
    this._desc = cfg.description || "";
    this._deps = cfg.dependencies || [];
    this._vars = cfg.variables || {};
    this._act = cfg.action || "";
    this._out = cfg.output || "";
  }

  get description(): string {
    return this._desc;
  }
  withDescription(desc: string): TargetBuilder {
    this._desc = desc;
    return this;
  }

  get dependencies(): string[] {
    return [...this._deps];
  }
  dependsOn(...deps: string[]): TargetBuilder {
    const all = new Set(this._deps);
    for (const d of deps) {
      all.add(d);
    }
    this._deps = [...all.values()];
    return this;
  }

  get variables(): Record<string, string> {
    return { ...this._vars };
  }
  withVariable(key: string, val: string): TargetBuilder {
    if (key in this._vars) throw new errors.DuplicateVariable(key);

    this._vars[key] = val;
    return this;
  }

  get action(): string {
    return this._act;
  }
  withAction(act: string): TargetBuilder {
    this._act = act;
    return this;
  }

  get output(): string {
    return this._out;
  }
  withOutput(out: string): TargetBuilder {
    this._out = out;
    return this;
  }

  static asBuilder(cfg: TargetConfig): TargetBuilder {
    if (cfg instanceof TargetBuilder) {
      return cfg as TargetBuilder;
    }
    return new TargetBuilder(cfg);
  }

  build(parent: Project): Target {
    return new Target(parent, this);
  }
}
