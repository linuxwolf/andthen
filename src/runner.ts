/** */

import { CircularDependency } from "./errors.ts";
import { Project } from "./projects/impl.ts";
import { Task } from "./tasks/impl.ts";
import { TaskPath, TaskPathArg } from "./tasks/path.ts";
import { create as createRegistry, TaskRegistry } from "./tasks/registry.ts";

export const _internals = {
  createRegistry,
};

interface RunnerChainState {
  chain: string[];
  defined: Map<string, Task>;
  pending: Set<string>;
}

export class Runner {
  readonly registry: TaskRegistry;

  #tasks = new Map<string, Task>();
  #chain: string[] = [];

  constructor(registry: TaskRegistry) {
    this.registry = registry;
  }

  get chain() {
    return [...this.#chain];
  }

  task(path: TaskPathArg): Task | undefined {
    return this.#tasks.get(path.toString());
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
      // assumes Set maintains insertion order
      const pending = [...state.pending.values()].reverse();
      throw new CircularDependency(pending);
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
    state.chain.push(pathStr);
    state.pending.delete(pathStr);

    return state;
  }

  async append(...paths: TaskPathArg[]): Promise<void> {
    const workingPath = this.registry.resolver.workingPath;

    const state = {
      pending: new Set<string>(),
      defined: this.#tasks,
      chain: this.#chain,
    }
    for (const path of paths) {
      const resolved = TaskPath.from(path).resolveFrom(workingPath);
      await this.#appendTask(state, resolved);
    }
  }
}

export async function create(
  workingDir: string,
  tasks: string[],
): Promise<Runner> {
  const registry = await _internals.createRegistry(workingDir);

  const runner = new Runner(registry);
  await runner.append(...tasks);

  return runner;
}
