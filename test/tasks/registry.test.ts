/** */

import { beforeEach, describe, it } from "deno_std/testing/bdd.ts";
import { expect } from "../mocking.ts";

import {
  ProjectResolver,
  ResolvedProject,
} from "../../src/projects/resolver.ts";
import { Project } from "../../src/projects/impl.ts";
import { TaskPath } from "../../src/tasks/path.ts";
import { RegistryImpl, TaskRegistry } from "../../src/tasks/registry.ts";

const PROJECT_CONFIG = {
  tasks: [
    { name: "build" },
    { name: "test" },
    { name: "clean" },
  ],
};

class MockResolver implements ProjectResolver {
  #registry?: TaskRegistry;
  workingDir: string;
  workingPath: TaskPath;
  rootDir: string;
  rootProject: Project;
  projects: Project[];

  constructor() {
    this.#registry = undefined;
    this.workingDir = "/devel/root/working";
    this.workingPath = new TaskPath("//working");
    this.rootDir = "/devel/root";
    this.rootProject = new ResolvedProject(this, {
      path: "//",
      ...PROJECT_CONFIG,
    });

    this.projects = [
      this.rootProject,
      new ResolvedProject(this, {
        path: "//working",
        ...PROJECT_CONFIG,
      }),
    ];
  }

  get registry() {
    return this.#registry!;
  }
  set registry(registry: TaskRegistry) {
    this.#registry = registry;
  }

  open(path: string | TaskPath): Promise<Project> {
    path = TaskPath.from(path).resolveFrom(this.workingPath).toString();

    return Promise.resolve(
      new ResolvedProject(this, {
        path,
        ...PROJECT_CONFIG,
      }),
    );
  }
}

describe("tasks/registry", () => {
  describe("RegistryImpl", () => {
    const resolver = new MockResolver();

    describe("ctor", () => {
      it("creates an uninitialized Registry", () => {
        const registry = new RegistryImpl();
        expect(registry.initialized).to.be.false();
      });
    });

    describe(".init()", () => {
      let registry: RegistryImpl;

      beforeEach(() => {
        registry = new RegistryImpl();
      });

      it("initializes with the given resolver", async () => {
        expect(registry.initialized).to.be.false();

        const result = await registry.init(resolver);
        expect(result).to.equal(registry);
        expect(result.resolver).to.equal(resolver);
      });
      it("initializes only once", async () => {
        expect(registry.initialized).to.be.false();

        await registry.init(resolver);

        const other = new MockResolver();
        const second = await registry.init(other);
        expect(second).to.equal(registry);
        expect(second.resolver).to.equal(resolver);
      });
    });
  });
});
