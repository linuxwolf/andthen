/** */

import { describe, it } from "deno_std/testing/bdd.ts";

import { Action } from "../../src/actions/base.ts";
import { expect } from "expecto/index.ts";

describe("actions/base", () => {
  describe("Action", () => {
    class MockAction extends Action {
      readonly type = "mock";
    }

    describe(".run()", () => {
      it("does nothing when run", async () => {
        const action = new MockAction({});

        const state = {
          cwd: "/devel/root/project",
          env: {},
        };
        const result = await action.run(state);
        expect(result).to.deep.equal({
          exported: {},
        });
      });
    });
  });
});
