/** */

import { TaskConfig } from "../tasks/config.ts";
import { Variables } from "../vars.ts";
import { ProjectConfig } from "./config.ts";

export class Project {
  readonly parent?: Project;
  readonly name: string;
  readonly root: boolean;

  #vars: Variables;
  #tasks: Record<string, TaskConfig>;

  constructor(cfg: ProjectConfig, parent?: Project) {
    this.parent = parent;
    this.name = cfg.name;
    this.root = cfg.root ?? false;
    this.#vars = { ...(cfg.vars ?? {}) };
    this.#tasks = { ...(cfg.tasks ?? {}) };
  }

  get vars() {
    return { ...this.#vars };
  }

  get tasks() {
    return { ...this.#tasks };
  }

  toConfig(): ProjectConfig {
    return {
      name: this.name,
      ...(this.parent && { parent: this.parent }),
      ...(this.root && { root: this.root }),
      ...((Object.entries(this.#vars).length > 0) && { vars: this.vars }),
      ...((Object.entries(this.#tasks).length > 0) && { tasks: this.tasks }),
    }
  }

  path(): string {
    const prefix = this.parent?.path() ?? "";
    return (prefix && prefix + "/") + this.name;
  }
}
