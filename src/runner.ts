/** */

import { Project } from "./projects/impl.ts";
import { Task } from "./tasks/impl.ts";
import { TaskPath, TaskPathArg } from "./tasks/path.ts";
import { create as createRegistry, TaskRegistry } from "./tasks/registry.ts";

export const _internals = {
  createRegistry,
};

interface RunnerChainState {
  chain: Task[];
  defined: Map<string, Task>;
  pending: Set<string>;
}

export class Runner {
  readonly registry: TaskRegistry;

  #chain: Task[] = [];

  constructor(registry: TaskRegistry) {
    this.registry = registry;
  }

  get chain() {
    return [...this.#chain];
  }

  async #appendTask(
    state: RunnerChainState,
    path: TaskPath,
  ): Promise<RunnerChainState> {
    // assume `path` is rooted
    const pathStr = path.toString();
    if (state.defined.has(pathStr)) {
      return state;
    } else if (state.pending.has(pathStr)) {
      // TODO: custom error
      throw new Error("circular dependency");
    }

    state.pending.add(pathStr);

    // obtain task ...
    const task = await this.registry.get(path);

    // ... and its dependencies
    const project = task.parent as Project;
    for (const dep of task.deps) {
      // resolve relative to task's parent project
      const depPath = TaskPath.from(dep).resolveFrom(project.taskPath);
      state = await this.#appendTask(state, depPath);
    }

    state.defined.set(pathStr, task);
    state.chain.push(task);
    state.pending.delete(pathStr);

    return state;
  }

  async append(path: TaskPathArg): Promise<void> {
    const workingPath = this.registry.resolver.workingPath;
    const resolved = TaskPath.from(path).resolveFrom(workingPath);
    await this.#appendTask({
      pending: new Set(),
      defined: new Map(),
      chain: this.#chain,
    }, resolved);
  }
}

export async function create(
  workingDir: string,
  tasks: string[],
): Promise<Runner> {
  const registry = await _internals.createRegistry(workingDir);

  const runner = new Runner(registry);
  const pending = tasks.map((path) => runner.append(path));
  await Promise.all(pending);

  return runner;
}
