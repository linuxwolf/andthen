/** */

import { describe, it } from "deno_std/testing/bdd.ts";
import { expect } from "expecto/index.ts";

import { InvalidVariableName } from "../src/errors.ts";
import { format, Variables, VariablesContext } from "../src/vars.ts";

class MockVarsContext implements VariablesContext {
  readonly parent?: MockVarsContext;
  readonly vars: Variables;

  constructor(vars: Variables, parent?: MockVarsContext) {
    this.vars = vars;
    this.parent = parent;
  }
}

describe("vars", () => {
  describe("format()", () => {
    describe("basics", () => {
      it("creates an empty envs from an empty context", () => {
        const ctx = new MockVarsContext({});
        const results = format(ctx);
        expect(results).to.deep.equal({});
      });
      it("creates an envs from a single level", () => {
        const ctx = new MockVarsContext({
          VAR_1: "first variable",
          VAR_2: "second variable",
          VAR_3: "third variable",
        });
        const results = format(ctx);
        expect(results).to.deep.equal({
          VAR_1: "first variable",
          VAR_2: "second variable",
          VAR_3: "third variable",
        });
      });
      it("creates an envs from 2 levels", () => {
        const parent = new MockVarsContext({
          VAR_2: "parent second variable",
          VAR_4: "parent fourth variable",
        });
        const ctx = new MockVarsContext({
          VAR_1: "first variable",
          VAR_2: "second variable",
          VAR_3: "third variable",
        }, parent);
        const results = format(ctx);
        expect(results).to.deep.equal({
          VAR_1: "first variable",
          VAR_2: "second variable",
          VAR_3: "third variable",
          VAR_4: "parent fourth variable",
        });
      });
    });
    describe("starting envs", () => {
      const envs = {
        VAR_2: "envs second variable",
        VAR_5: "envs fifth variable",
      };

      it("creates an empty envs from an empty context", () => {
        const ctx = new MockVarsContext({});
        const results = format(ctx, envs);
        expect(results).to.deep.equal({
          VAR_2: "envs second variable",
          VAR_5: "envs fifth variable",
          });
      });
      it("creates an envs from a single level", () => {
        const ctx = new MockVarsContext({
          VAR_1: "first variable",
          VAR_2: "second variable",
          VAR_3: "third variable",
        });
        const results = format(ctx, envs);
        expect(results).to.deep.equal({
          VAR_1: "first variable",
          VAR_2: "second variable",
          VAR_3: "third variable",
          VAR_5: "envs fifth variable",
          });
      });
      it("creates an envs from 2 levels", () => {
        const parent = new MockVarsContext({
          VAR_2: "parent second variable",
          VAR_4: "parent fourth variable",
        });
        const ctx = new MockVarsContext({
          VAR_1: "first variable",
          VAR_2: "second variable",
          VAR_3: "third variable",
        }, parent);
        const results = format(ctx, envs);
        expect(results).to.deep.equal({
          VAR_1: "first variable",
          VAR_2: "second variable",
          VAR_3: "third variable",
          VAR_4: "parent fourth variable",
          VAR_5: "envs fifth variable",
        });
      });
    });
    describe("errors", () => {
      it("fails on an invalid var name", () => {
        const ctx = new MockVarsContext({
          "1_BAD_VAR": "bad variable",
        });
        const err = expect(() => format(ctx)).to.throw(InvalidVariableName).actual;
        expect(err.varname).to.equal("1_BAD_VAR");
      });
    });
  });
});
