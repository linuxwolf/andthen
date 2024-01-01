/** */

import { afterEach, beforeEach, describe, it } from "deno_std/testing/bdd.ts";
import { expect, mock } from "../mocking.ts";

import {
  ProjectResolver,
  ResolvedProject,
} from "../../src/projects/resolver.ts";
import { Project } from "../../src/projects/impl.ts";
import { TaskPath, TaskPathArg } from "../../src/tasks/path.ts";
import {
  _internals,
  create,
  RegistryImpl,
  TaskRegistry,
} from "../../src/tasks/registry.ts";
import { TaskNotFound } from "../../src/errors.ts";

const PROJECT_CONFIG = {
  tasks: [
    { name: "default" },
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

  open(path: TaskPathArg): Promise<Project> {
    path = "//" + TaskPath.from(path).resolveFrom(this.workingPath).path;

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

    describe(".get()", () => {
      let registry: RegistryImpl;
      let resolverOpenSpy: mock.Spy;
      let createResolverStub: mock.Stub;

      beforeEach(async () => {
        const resolver = new MockResolver();
        resolverOpenSpy = mock.spy(resolver, "open");
        createResolverStub = mock.stub(
          _internals,
          "createResolver",
          () => Promise.resolve(resolver),
        );

        registry = await create("/devel/root/working") as RegistryImpl;
        resolver.registry = registry;
      });

      afterEach(() => {
        createResolverStub && !createResolverStub.restored &&
          createResolverStub.restore();
      });

      it("creates a task found in the 'current' project", async () => {
        const result = await registry.get(":build");
        expect(result.name).to.equal("build");
        expect(result.parent).to.be.an.instanceOf(Project);
        expect((result.parent as Project).toConfig()).to.deep.equal({
          path: "//working",
          ...PROJECT_CONFIG,
        });

        expect(resolverOpenSpy).to.have.been.deep.calledWith([
          new TaskPath("//working:build"),
        ]);
      });
      it("creates a task in a sub-project", async () => {
        const result = await registry.get("sub-working:build");
        expect(result.name).to.equal("build");
        expect(result.parent).to.be.an.instanceOf(Project);
        expect((result.parent as Project).toConfig()).to.deep.equal({
          path: "//working/sub-working",
          ...PROJECT_CONFIG,
        });

        expect(resolverOpenSpy).to.have.been.deep.calledWith([
          new TaskPath("//working/sub-working:build"),
        ]);
      });

      it("creates a task from a sibling", async () => {
        const result = await registry.get("../sibling:build");
        expect(result.name).to.equal("build");
        expect(result.parent).to.be.an.instanceOf(Project);
        expect((result.parent as Project).toConfig()).to.deep.equal({
          path: "//sibling",
          ...PROJECT_CONFIG,
        });
      });

      it("creates a default task", async () => {
        const result = await registry.get("sub-working");
        expect(result.name).to.equal("default");
        expect(result.parent).to.be.an.instanceOf(Project);
        expect((result.parent as Project).toConfig()).to.deep.equal({
          path: "//working/sub-working",
          ...PROJECT_CONFIG,
        });
      });

      it("creates a task from a rooted path", async () => {
        const result = await registry.get("//working:build");
        expect(result.name).to.equal("build");
        expect(result.parent).to.be.an.instanceOf(Project);
        expect((result.parent as Project).toConfig()).to.deep.equal({
          path: "//working",
          ...PROJECT_CONFIG,
        });

        expect(resolverOpenSpy).to.have.been.deep.calledWith([
          new TaskPath("//working:build"),
        ]);
      });

      it("returns a cached task", async () => {
        const first = await registry.get("//working:build");

        const second = await registry.get("//working:build");
        expect(second).to.equal(first);
      });

      it("throws if task not found", async () => {
        const err = (await expect(registry.get("//working:not-a-task")).to.be
          .rejectedWith(TaskNotFound)).actual;
        expect(err.path).to.equal("//working:not-a-task");
      });
    });
  });
});
