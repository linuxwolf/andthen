/** */

import { afterEach, beforeAll, beforeEach, describe, it } from "deno_std/testing/bdd.ts";
import { expect, mock } from "./mocking.ts";

import { FakeProjectResolver, FakeTaskRegistry } from "./fakes.ts";
import { Runner } from "../src/runner.ts";
import { TaskPath } from "../src/tasks/path.ts";

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
    });
  });
});
