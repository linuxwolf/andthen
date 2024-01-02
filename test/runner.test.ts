/** */

import { beforeAll, describe, it } from "deno_std/testing/bdd.ts";
import { expect } from "./mocking.ts";

import { FakeProjectResolver, FakeTaskRegistry } from "./fakes.ts";
import { Runner } from "../src/runner.ts";

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
    });
  });
});
