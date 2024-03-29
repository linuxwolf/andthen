/** */

import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  it,
} from "deno_std/testing/bdd.ts";
import { expect, mock } from "./mocking.ts";

import { FakeProjectResolver, FakeTaskRegistry } from "./fakes.ts";
import { _internals, create, Runner } from "../src/runner.ts";
import { TaskPath } from "../src/tasks/path.ts";
import { CircularDependency, TaskNotFound } from "../src/errors.ts";
import { TaskRegistry } from "../src/tasks/registry.ts";

describe("runner", () => {
  const registry = new FakeTaskRegistry();
  const resolver = new FakeProjectResolver(registry);

  beforeAll(() => {
    registry.resolver = resolver;
  });

  describe("Runner", () => {
    describe("ctor", () => {
      it("creates an empty Runner", () => {
        const runner = new Runner(registry);
        expect(runner.registry).to.equal(registry);
        expect(runner.chain).to.be.empty();
      });
    });

    describe(".append()", () => {
      let runner: Runner;
      let spyRegistryGet: mock.Spy;

      beforeEach(() => {
        spyRegistryGet = mock.spy(registry, "get");
        runner = new Runner(registry);
      });
      afterEach(() => {
        spyRegistryGet.restore();
        registry.reset();
      });

      describe("basics", () => {
        it("builds a single-task chain", async () => {
          const result = await runner.append(":build");
          expect(result).to.deep.equal([
            "//project:build",
          ]);
          expect(runner.chain).to.deep.equal([
            "//project:build",
          ]);

          expect(spyRegistryGet).to.be.deep.calledWith([
            new TaskPath("//project:build"),
          ]);
        });
        it("builds a simple deps chain", async () => {
          registry.defined = {
            "//project:build": {
              name: "build",
              deps: [":init"],
            },
          };

          const result = await runner.append(":build");
          expect(result).to.deep.equal([
            "//project:init",
            "//project:build",
          ]);
          expect(runner.chain).to.deep.equal([
            "//project:init",
            "//project:build",
          ]);

          expect(spyRegistryGet).to.be.deep.calledWith([
            new TaskPath("//project:build"),
          ]);
          expect(spyRegistryGet).to.be.deep.calledWith([
            new TaskPath("//project:init"),
          ]);
        });
        it("builds a relative deps chain", async () => {
          registry.defined = {
            "//project:build": {
              name: "build",
              deps: [":init", "sub-project:build", "../side-project:build"],
            },
          };

          const result = await runner.append(":build");
          expect(result).to.deep.equal([
            "//project:init",
            "//project/sub-project:build",
            "//side-project:build",
            "//project:build",
          ]);
          expect(runner.chain).to.deep.equal([
            "//project:init",
            "//project/sub-project:build",
            "//side-project:build",
            "//project:build",
          ]);

          expect(spyRegistryGet).to.be.deep.calledWith([
            new TaskPath("//project:build"),
          ]);
          expect(spyRegistryGet).to.be.deep.calledWith([
            new TaskPath("//project:init"),
          ]);
          expect(spyRegistryGet).to.be.deep.calledWith([
            new TaskPath("//project/sub-project:build"),
          ]);
          expect(spyRegistryGet).to.be.deep.calledWith([
            new TaskPath("//side-project:build"),
          ]);
        });
        it("builds an optimized chain", async () => {
          registry.defined = {
            "//project:build": {
              name: "build",
              deps: [":init"],
            },
            "//project:test": {
              name: "test",
              deps: [":init"],
            },
          };

          const result = await runner.append(
            ":build",
            ":test",
          );
          expect(result).to.deep.equal([
            "//project:init",
            "//project:build",
            "//project:test",
          ]);
          expect(runner.chain).to.deep.equal([
            "//project:init",
            "//project:build",
            "//project:test",
          ]);

          expect(spyRegistryGet).to.be.called(3);
          expect(spyRegistryGet).to.be.deep.calledWith([
            new TaskPath("//project:build"),
          ]);
          expect(spyRegistryGet).to.be.deep.calledWith([
            new TaskPath("//project:init"),
          ]);
          expect(spyRegistryGet).to.be.deep.calledWith([
            new TaskPath("//project:test"),
          ]);
        });
      });

      describe("subsequent appends", () => {
        beforeEach(async () => {
          registry.defined = {
            "//project:build": {
              name: "build",
              deps: [":init"],
            },
            "//project:test": {
              name: "test",
              deps: [":init"],
            },
            "//project:coverage": {
              name: "coverage",
              deps: [":test"],
            },
            "//project:doc": {
              name: "doc",
              deps: [":clean-doc", ":prep-doc"],
            },
          };

          await runner.append(":build");
        });

        it("appends a single task", async () => {
          const result = await runner.append(":clean");
          expect(result).to.deep.equal([
            "//project:clean",
          ]);
          expect(runner.chain).to.deep.equal([
            "//project:init",
            "//project:build",
            "//project:clean",
          ]);
        });
        it("appends a task with deps", async () => {
          const result = await runner.append(":doc");
          expect(result).to.deep.equal([
            "//project:clean-doc",
            "//project:prep-doc",
            "//project:doc",
          ]);
          expect(runner.chain).to.deep.equal([
            "//project:init",
            "//project:build",
            "//project:clean-doc",
            "//project:prep-doc",
            "//project:doc",
          ]);
        });
        it("appends only the new tasks", async () => {
          const result = await runner.append(":coverage");
          expect(result).to.deep.equal([
            "//project:test",
            "//project:coverage",
          ]);
          expect(runner.chain).to.deep.equal([
            "//project:init",
            "//project:build",
            "//project:test",
            "//project:coverage",
          ]);
        });
      });

      describe("failures", () => {
        it("throws on self circular dependency", async () => {
          registry.defined = {
            "//project:build": {
              name: "build",
              deps: [":build"],
            },
          };

          const err = (await expect(runner.append(":build")).to.be.rejectedWith(
            CircularDependency,
          )).actual;
          expect(err.paths).to.deep.equal([
            "//project:build",
          ]);
        });
        it("throws on deep circular dependency", async () => {
          registry.defined = {
            "//project:build": {
              name: "build",
              deps: [":init"],
            },
            "//project:init": {
              name: "init",
              deps: ["//tools:init"],
            },
            "//tools:init": {
              name: "init",
              deps: ["//project:build"],
            },
          };

          const result = runner.append(":build");
          const err =
            (await expect(result).to.be.rejectedWith(CircularDependency))
              .actual;
          expect(err.paths).to.deep.equal([
            "//tools:init",
            "//project:init",
            "//project:build",
          ]);
        });
        it("throws when task is not defined", async () => {
          registry.missing = ["//project:lint"];

          const err = (await expect(runner.append(":lint")).to.be.rejectedWith(
            TaskNotFound,
          )).actual;
          expect(err.path).to.equal("//project:lint");
        });
      });
    });

    describe(".task()", () => {
      let runner: Runner;
      let spyRegistryGet: mock.Spy;

      beforeEach(async () => {
        runner = new Runner(registry);
        await runner.append("//:init", ":build", ":test");

        spyRegistryGet = mock.spy(registry, "get");
      });
      afterEach(() => {
        registry.reset();
        spyRegistryGet.restore();
      });

      it("returns the existing task", () => {
        const result = runner.task("//project:build");
        expect(result).to.exist();
        expect(result!.name).to.equal("build");

        expect(spyRegistryGet).to.have.not.been.called();
      });
      it("returns undefined for nonexistent task", () => {
        const result = runner.task("//project:lint");
        expect(result).to.be.undefined();

        expect(spyRegistryGet).to.have.not.been.called();
      });
    });
  });

  describe("create()", () => {
    let spyCreateRegistry: mock.Spy;

    beforeEach(() => {
      spyCreateRegistry = mock.stub(
        _internals,
        "createRegistry",
        (_: string): Promise<TaskRegistry> => Promise.resolve(registry),
      );
    });
    afterEach(() => {
      spyCreateRegistry.restore();
      registry.reset();
    });

    it("creates an empty Runner", async () => {
      const result = await create("/devel/root/project");

      expect(result.chain).to.deep.equal([]);

      expect(spyCreateRegistry).to.be.deep.calledWith([
        "/devel/root/project",
      ]);
    });
    it("creates an initialized Runner", async () => {
      const result = await create("/devel/root/project", [":build", ":test"]);

      expect(result.chain).to.deep.equal([
        "//project:build",
        "//project:test",
      ]);

      expect(spyCreateRegistry).to.be.deep.calledWith([
        "/devel/root/project",
      ]);
    });
  });
});
