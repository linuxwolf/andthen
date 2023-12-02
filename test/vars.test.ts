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
    describe("interpolation", () => {
      const envs = {
        VAR_2: "envs second var",
        VAR_5: "envs fifth var",
      };

      it("does simple replacement", () => {
        const ctx = new MockVarsContext({
          VAR_1: "interpolate ${VAR_2}",
          VAR_3: "${VAR_5}",
          VAR_4: "from '${VAR_10}'",
        });
        const results = format(ctx, envs);
        expect(results).to.deep.equal({
          VAR_1: "interpolate envs second var",
          VAR_2: "envs second var",
          VAR_3: "envs fifth var",
          VAR_4: "from ''",
          VAR_5: "envs fifth var",
        });
      });
      it("replacement within siblings", () => {
        const ctx = new MockVarsContext({
          VAR_1: "static first var",
          VAR_2: "carried '${VAR_1}'",
          VAR_3: "carried '${VAR_4}'",
          VAR_4: "static fourth var",
        });
        const results = format(ctx, envs);
        expect(results).to.deep.equal({
          VAR_1: "static first var",
          VAR_2: "carried 'static first var'",
          VAR_3: "carried ''",
          VAR_4: "static fourth var",
          VAR_5: "envs fifth var",
          });
      });

      it("escapes the $", () => {
        const ctx = new MockVarsContext({
          VAR_1: "this is an escaped $$ sequence",
          VAR_2: "$$",
          VAR_3: "$${NOT_A_VAR}",
        });
        const results = format(ctx);
        expect(results).to.deep.equal({
          VAR_1: "this is an escaped $ sequence",
          VAR_2: "$",
          VAR_3: "${NOT_A_VAR}",
        });
      });
    });
    describe("errors", () => {
      it("fails on an invalid var name", () => {
        const ctx = new MockVarsContext({
          "1_BAD_VAR": "bad variable",
        });
        const err =
          expect(() => format(ctx)).to.throw(InvalidVariableName).actual;
        expect(err.varname).to.equal("1_BAD_VAR");
      });
    });
  });
});
