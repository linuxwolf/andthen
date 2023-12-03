/** */

import { InvalidRootProject } from "../errors.ts";
import { TaskConfig } from "../tasks/config.ts";
import { Variables } from "../vars.ts";
import { ProjectConfig } from "./config.ts";

export class Project {
  readonly parent?: Project;
  readonly name: string;
  readonly root: boolean;
  readonly default: string;

  #vars: Variables;
  #tasks: Record<string, TaskConfig>;

  constructor(cfg: ProjectConfig, parent?: Project) {
    if (parent && cfg.root) {
      throw new InvalidRootProject(`${parent.path()}/${cfg.name}`);
    }

    const tasks = (cfg.tasks ?? []).reduce(
      (coll: Record<string, TaskConfig>, t: TaskConfig) => {
        coll[t.name] = t;
        return coll;
      },
      {},
    );

    this.parent = parent;
    this.name = cfg.name;
    this.root = cfg.root ?? false;
    this.default = cfg.default ?? "default";
    this.#vars = { ...(cfg.vars ?? {}) };
    this.#tasks = tasks;
  }

  get vars() {
    return { ...this.#vars };
  }

  get tasks() {
    return { ...this.#tasks };
  }

  toConfig(): ProjectConfig {
    const vars = this.vars;
    const tasks = Object.values(this.#tasks);

    return {
      name: this.name,
      ...(this.root && { root: this.root }),
      ...((this.default !== "default") && { default: this.default }),
      ...((Object.entries(vars).length > 0) && { vars }),
      ...((tasks.length > 0) && { tasks }),
    };
  }

  path(): string {
    const prefix = this.parent?.path() ?? "";
    return (prefix && prefix + "/") + this.name;
  }
}
