/** */

import { Project } from "../src/projects/impl.ts";
import { ProjectResolver } from "../src/projects/resolver.ts";
import { Task } from "../src/tasks/impl.ts";
import { TaskPath, TaskPathArg } from "../src/tasks/path.ts";
import { TaskRegistry } from "../src/tasks/registry.ts";

export class FakeProjectResolver implements ProjectResolver {
  readonly registry: TaskRegistry;

  workingDir = "/devel/root/project";
  workingPath = new TaskPath("/devel/root/project");
  rootDir = "/devel/root";
  rootProject = new Project({ path: "//" });
  projects = [];

  constructor(registry: TaskRegistry) {
    this.registry = registry;
  }

  open(_path: TaskPathArg): Promise<Project> {
    throw new Error("Method not implemented.");
  }
}

export class FakeTaskRegistry implements TaskRegistry {
  #resolver?: ProjectResolver = undefined;

  get resolver(): ProjectResolver {
    return this.#resolver!;
  }
  set resolver(r: ProjectResolver) {
    this.#resolver = r;
  }

  get(path: TaskPathArg): Promise<Task> {
    return Promise.resolve(
      new Task({
        name: TaskPath.from(path).task,
      }),
    );
  }
}

