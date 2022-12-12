import { path } from "../deps.ts";
import { Optional } from "../util/types.ts";
import { checkName as checkName } from "../util/naming.ts";
import { Project } from "./project.ts";
import { Context, VariableBuiler, Variables } from "./vars.ts";
import * as errors from "../errors/mod.ts";

const { posix } = path;

export interface TargetPathInfo {
  readonly target: string;
  readonly path: string;
  readonly root: boolean;
  readonly absolute: boolean;
  readonly segments: string[];
}

export class TargetPath {
  readonly path: string;
  readonly target: string;
  readonly root: boolean;
  readonly absolute: boolean;
  readonly segments: string[];

  private constructor(info: TargetPathInfo) {
    this.path = info.path;
    this.target = info.target;
    this.root = info.root;
    this.absolute = info.absolute;
    this.segments = info.segments;
  }

  toString(): string {
    const tpath = (() => {
      if (this.path === "//" || this.path === "/" || this.path.endsWith("./")) {
        return this.path;
      }
      return this.path.substring(0, this.path.length - 1);
    })();
    return `${tpath}:${this.target}`;
  }

  relativeTo(base: TargetPath): TargetPath {
    if (this.absolute || this.root) {
      return this;
    }

    return TargetPath.parse(`${base.path}/${this.path}:${this.target}`);
  }

  static parse(input: string): TargetPath {
    if (!input) {
      input = "default";
    }

    let target = "";
    let path = "";
    let segments: string[] = [];
    let root = false;
    let absolute = false;

    if (input.startsWith("//")) {
      root = true;
      input = input.substring(1);
    }

    if (input.startsWith("/:") && root) {
      path = "/";
      target = input.substring(2);
    } else if (input.startsWith("/")) {
      absolute = !root && true;
      path = input;
    } else if (input.startsWith("..") || input.startsWith(".")) {
      path = input;
    } else {
      target = input;
    }

    if (path) {
      let remainder = path;
      while (remainder !== "") {
        const p = posix.parse(remainder);
        remainder = p.dir;
        if (p.base !== "") {
          segments.unshift(p.base);
        }
        remainder = (p.dir === "/") ? "" : p.dir;
      }
      const [endPath, targetName] = (segments.pop() || "").split(":", 2);
      target = targetName || target || "default";
      segments.push(endPath);
      segments = segments.filter((p) => !!p);
    } else {
      segments = ["."];
    }

    //simplify segments
    segments = segments.reduce((acc: string[], segment: string): string[] => {
      let prev: Optional<string>;
      switch (segment) {
        case "..":
          // lose parent and current; unless ...
          prev = acc.pop();
          if (prev === undefined || prev == "..") {
            // parent is relative or no parent yet, then keep ".."
            prev && acc.push(prev);
            acc.push("..");
          }
          break;
        case ".":
          // lose current segment; unless ...
          prev = acc.pop();
          if (prev === undefined && !root && !absolute) {
            // no parent yet, then keep "." if NOT root or absolute
            acc.push(".");
          } else if (prev) {
            // if parent, keep just the parent!
            acc.push(prev);
          }
          break;
        default:
          acc.push(segment);
          break;
      }
      return acc;
    }, []);

    // recreate and fixup path
    path = segments.join("/");
    if (segments.length === 0 || !segments[0].startsWith(".")) {
      path = ((root && "//") || (absolute && "/")) + path;
    }
    if (!path.endsWith("/")) {
      path += "/";
    }

    return new TargetPath({
      target,
      path,
      segments,
      root,
      absolute,
    });
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
