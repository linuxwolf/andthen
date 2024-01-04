/** */

import { TaskNotFound } from "../src/errors.ts";
import { Project } from "../src/projects/impl.ts";
import { ProjectResolver } from "../src/projects/resolver.ts";
import { TaskConfig } from "../src/tasks/config.ts";
import { Task } from "../src/tasks/impl.ts";
import { TaskPath, TaskPathArg } from "../src/tasks/path.ts";
import { TaskRegistry } from "../src/tasks/registry.ts";

export class FakeProjectResolver implements ProjectResolver {
  readonly registry: TaskRegistry;

  workingDir = "/devel/root/project";
  workingPath = new TaskPath("//project");
  rootDir = "/devel/root";
  rootProject = new Project({ path: "//" });
  projects = [];

  constructor(registry: TaskRegistry) {
    this.registry = registry;
  }

  open(path: TaskPathArg): Promise<Project> {
    // TODO: obtain parent
    const project = new Project({
      path: path.toString(),
    });

    return Promise.resolve(project);
  }
}

export class FakeTaskRegistry implements TaskRegistry {
  missing: string[] = [];
  defined: Record<string, TaskConfig> = {};

  #resolver?: ProjectResolver = undefined;

  get resolver(): ProjectResolver {
    return this.#resolver!;
  }
  set resolver(r: ProjectResolver) {
    this.#resolver = r;
  }

  reset() {
    this.missing = [];
    this.defined = {};
  }

  async get(path: TaskPathArg): Promise<Task> {
    const resolved = TaskPath.from(path);

    const project = await this.resolver.open("//" + resolved.path);
    if (this.missing.includes(resolved.toString())) {
      return Promise.reject(new TaskNotFound(resolved.toString()));
    }

    let result: Task;
    if (resolved.toString() in this.defined) {
      result = new Task({
        ...this.defined[resolved.toString()],
        name: resolved.task,
      }, project);
    } else {
      result = new Task({
        name: TaskPath.from(path).task,
      }, project);
    }
    return Promise.resolve(result);
  }
}
