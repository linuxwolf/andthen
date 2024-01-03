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
import { Runner } from "../src/runner.ts";
import { TaskPath } from "../src/tasks/path.ts";
import { CircularDependency } from "../src/errors.ts";

describe("runner", () => {
  describe("Runner", () => {
    const registry = new FakeTaskRegistry();
    const resolver = new FakeProjectResolver(registry);

    beforeAll(() => {
      registry.resolver = resolver;
    });

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

      it("builds a single-task chain", async () => {
        await runner.append(":build");
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

        await runner.append(":build");
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

        await runner.append(":build");
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

        await runner.append(
          ":build",
          ":test",
        );
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
          (await expect(result).to.be.rejectedWith(CircularDependency)).actual;
        expect(err.paths).to.deep.equal([
          "//tools:init",
          "//project:init",
          "//project:build",
        ]);
      });
    });
  });
});
