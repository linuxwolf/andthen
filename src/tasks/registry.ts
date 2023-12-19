/** */

import { TaskNotFound } from "../errors.ts";
import {
  create as createResolver,
  ProjectResolver,
} from "../projects/resolver.ts";
import { Task } from "./impl.ts";
import { TaskPath } from "./path.ts";

export const _internals = {
  createResolver,
};

export interface TaskRegistry {
  get(path: string | TaskPath): Promise<Task>;
}

export async function create(path: string): Promise<TaskRegistry> {
  const registry = new RegistryImpl();
  const resolver = await _internals.createResolver(registry, path);
  return await registry.init(resolver);
}

export class RegistryImpl implements TaskRegistry {
  #resolver?: ProjectResolver = undefined;
  #cache: Record<string, Task> = {};

  constructor() {}

  get initialized(): boolean {
    return this.#resolver !== undefined;
  }

  /* async */ init(resolver: ProjectResolver): Promise<RegistryImpl> {
    if (!this.#resolver) {
      this.#resolver = resolver;
    }

    return Promise.resolve(this);
  }

  get resolver(): ProjectResolver {
    return this.#resolver!;
  }

  async get(path: string | TaskPath): Promise<Task> {
    const resolved = TaskPath.from(path).resolveFrom(this.resolver.workingPath);
    const resolvedPath = resolved.toString();

    let result = this.#cache[resolvedPath];
    if (result) {
      return result;
    }

    const project = await this.resolver.open(resolved);
    const cfg = project.tasks[resolved.task];
    if (!cfg) {
      throw new TaskNotFound(resolvedPath);
    }

    //TODO: templates!
    this.#cache[resolvedPath] = result = new Task(cfg, project);

    return result;
  }
}
