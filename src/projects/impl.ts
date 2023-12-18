/** */

import { InvalidRootProject } from "../errors.ts";
import { TaskConfig } from "../tasks/config.ts";
import { collapse, Variables } from "../vars.ts";
import { ProjectConfig } from "./config.ts";

export class Project {
  readonly parent?: Project;
  readonly path: string;
  readonly root: boolean;
  readonly desc: string;

  #vars: Variables;
  #tasks: Record<string, TaskConfig>;

  constructor(cfg: ProjectConfig, parent?: Project) {
    if (parent && cfg.root) {
      throw new InvalidRootProject(`${cfg.path}`);
    }

    const tasks = (cfg.tasks ?? []).reduce(
      (coll: Record<string, TaskConfig>, t: TaskConfig) => {
        coll[t.name] = t;
        return coll;
      },
      {},
    );

    this.parent = parent;
    this.path = cfg.path;
    this.root = cfg.root ?? false;
    this.desc = cfg.desc ?? "";
    this.#vars = collapse({
      parent,
      vars: cfg.vars || {},
    });
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
      path: this.path,
      ...(this.desc && { desc: this.desc }),
      ...(this.root && { root: this.root }),
      ...((Object.entries(vars).length > 0) && { vars }),
      ...((tasks.length > 0) && { tasks }),
    };
  }
}
