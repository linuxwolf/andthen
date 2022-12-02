import { path } from "../deps.ts";
import { Optional } from "../util/types.ts";
import { checkName as checkName } from "../util/naming.ts";
import { Project } from "./project.ts";
import { Context, VariableBuiler, Variables } from "./vars.ts";
import * as errors from "../errors.ts";

const { posix } = path;

export class TargetPath {
  readonly path: string;
  readonly task: string;
  readonly absolute: boolean;
  readonly segments: string[];

  constructor(target: string, base?: string) {
    if (!target.startsWith("/") && !!base) {
      // apply base if target is not absolute
      target = base + "/" + target;
    }

    // TODO: optimize this
    // walk target backward into segments
    let segments: string[] = [];
    let absolute = false;
    let remainder = target;
    while (remainder !== "") {
      const p = posix.parse(remainder);
      remainder = p.dir;
      if (p.base !== "") {
        segments.unshift(p.base);
      }
      absolute = p.dir === "/";
      remainder = absolute ? "" : p.dir;
    }

    // extract task (or use default)
    let [endPath, task] = (segments.pop() || "").split(":", 2);
    if (!task) {
      task = "default";
    }
    segments.push(endPath);

    // simplify segments
    segments = segments.reduce((acc: string[], segment: string): string[] => {
      let prev: Optional<string>;
      switch (segment) {
        case "..":
          // lose parent and current segments; unless ...
          prev = acc.pop();
          if (prev === undefined || prev === "..") {
            // parent is relative or no parent yet, then keep ".."
            prev && acc.push(prev);
            acc.push("..");
          }
          break;
        case ".":
          // lose current segment
          break;
        case "":
          // lose empty
          break;
        default:
          acc.push(segment);
      }
      return acc;
    }, []);

    // populate fields
    const fullPath = (absolute ? "/" : "") + segments.join("/");

    this.path = fullPath;
    this.task = task;
    this.absolute = absolute;
    this.segments = segments;
  }

  toString(): string {
    return `${this.path}:${this.task}`;
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
  readonly description: string;
  readonly dependencies: string[];
  readonly variables: Variables;
  readonly action: string;
  readonly output: string;

  constructor(parent: Project, cfg: TargetConfig) {
    this.name = checkName(cfg.name);
    this.parent = parent;
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

  constructor(name: string) {
    this.name = checkName(name);
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

  build(parent: Project): Target {
    return new Target(parent, this);
  }
}
