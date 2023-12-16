/** */

import { describe, it } from "deno_std/testing/bdd.ts";
import { expect } from "expecto/index.ts";

import { InvalidVariableName } from "../src/errors.ts";
import { collapse, resolve, resolveAll, Variables, VariablesContext } from "../src/vars.ts";

class MockVarsContext implements VariablesContext {
  readonly parent?: MockVarsContext;
  readonly vars?: Variables;

  constructor(vars?: Variables, parent?: MockVarsContext) {
    this.vars = vars;
    this.parent = parent;
  }
}

describe("vars", () => {
  describe("collapse()", () => {
    describe("basics", () => {
      it("creates an empty vars from an undefined context", () => {
        const ctx = new MockVarsContext();
        const results = collapse(ctx);
        expect(results).to.deep.equal({});
      });
      it("creates an empty vars from an empty context", () => {
        const ctx = new MockVarsContext({});
        const results = collapse(ctx);
        expect(results).to.deep.equal({});
      });
      it("creates a vars from a single level", () => {
        const ctx = new MockVarsContext({
          VAR_1: "first variable",
          VAR_2: "second variable",
          VAR_3: "third variable",
        });
        const results = collapse(ctx);
        expect(results).to.deep.equal({
          VAR_1: "first variable",
          VAR_2: "second variable",
          VAR_3: "third variable",
        });
      });
      it("creates a vars from 2 levels", () => {
        const parent = new MockVarsContext({
          VAR_2: "parent second variable",
          VAR_4: "parent fourth variable",
        });
        const ctx = new MockVarsContext({
          VAR_1: "first variable",
          VAR_2: "second variable",
          VAR_3: "third variable",
        }, parent);
        const results = collapse(ctx);
        expect(results).to.deep.equal({
          VAR_1: "first variable",
          VAR_2: "second variable",
          VAR_3: "third variable",
          VAR_4: "parent fourth variable",
        });
      });
    });
    describe("interpolation", () => {
      it("replaces with 2 levels", () => {
        const parent = new MockVarsContext({
          VAR_1: "parent var one",
          VAR_3: "parent var three",
          VAR_5: "parent ${VAR_5}",
        });
        const ctx = new MockVarsContext({
          VAR_1: "context ${VAR_1}",
          VAR_3: "context ${VAR_2}",
          VAR_5: "context ${VAR_5}",
        }, parent);

        const results = collapse(ctx);
        expect(results).to.deep.equal({
          VAR_1: "context parent var one",
          VAR_3: "context ${VAR_2}",
          VAR_5: "context parent ${VAR_5}",
        });
      });
      it("replacement within siblings", () => {
        const ctx = new MockVarsContext({
          VAR_1: "static first var",
          VAR_2: "carried '${VAR_1}'",
          VAR_4: "static fourth var",
        });
        const results = collapse(ctx);
        expect(results).to.deep.equal({
          VAR_1: "static first var",
          VAR_2: "carried 'static first var'",
          VAR_4: "static fourth var",
        });
      });
      it("does not escape the $", () => {
        const ctx = new MockVarsContext({
          VAR_1: "this is an escaped $$ sequence",
          VAR_2: "$$",
          VAR_3: "$${NOT_A_VAR}",
        });
        const results = collapse(ctx);
        expect(results).to.deep.equal({
          VAR_1: "this is an escaped $$ sequence",
          VAR_2: "$$",
          VAR_3: "$${NOT_A_VAR}",
        });
      });
      it("does not apply defaults", () => {
        const ctx = new MockVarsContext({
          VAR_1: "context ${VAR_2:-default var two}",
          VAR_2: "context var two",
        });
        const results = collapse(ctx);
        expect(results).to.deep.equal({
          VAR_1: "context ${VAR_2:-default var two}",
          VAR_2: "context var two",
        });
      });
    });
    describe("errors", () => {
      it("fails on an invalid var name", () => {
        const ctx = new MockVarsContext({
          "1_BAD_VAR": "bad variable",
        });
        const err =
          expect(() => collapse(ctx)).to.throw(InvalidVariableName).actual;
        expect(err.varname).to.equal("1_BAD_VAR");
      });
    });
  });

  describe("resolve()", () => {
    const envs = {
      VAR_2: "envs second variable",
      VAR_5: "envs fifth variable",
    };

    describe("basics", () => {
      it("resolves without envs", () => {
        const vars = {
          VAR_1: "vars var one",
          VAR_2: "vars ${VAR_2}",
          VAR_5: "${VAR_5:-default var five}",
        };
        const results = resolve(vars);
        expect(results).to.deep.equal({
          VAR_1: "vars var one",
          VAR_2: "vars ",
          VAR_5: "default var five",
        });
      });
      it("resolves with envs", () => {
        const vars = {
          VAR_1: "vars var one",
          VAR_2: "vars ${VAR_2}",
          VAR_5: "${VAR_5:-default var five}",
        };
        const results = resolve(vars, envs);
        expect(results).to.deep.equal({
          VAR_1: "vars var one",
          VAR_2: "vars envs second variable",
          VAR_5: "envs fifth variable",
        });
      });
      it("escapes $", () => {
        const vars = {
          VAR_1: "$$",
          VAR_2: "this is $$ in the middle",
          VAR_3: "this is an escaped $${VAR_REF}",
          VAR_4: "$${VAR_REF_2:-default value}",
        };
        const results = resolve(vars);
        expect(results).to.deep.equal({
          VAR_1: "$",
          VAR_2: "this is $ in the middle",
          VAR_3: "this is an escaped ${VAR_REF}",
          VAR_4: "${VAR_REF_2:-default value}",
        });
      });
    });
  });

  describe("resolveAll()", () => {
    describe("basics", () => {
      it("creates an empty envs from an undefined context", () => {
        const ctx = new MockVarsContext();
        const results = resolveAll(ctx);
        expect(results).to.deep.equal({});
      });
      it("creates an empty envs from an empty context", () => {
        const ctx = new MockVarsContext({});
        const results = resolveAll(ctx);
        expect(results).to.deep.equal({});
      });
      it("creates an envs from a single level", () => {
        const ctx = new MockVarsContext({
          VAR_1: "first variable",
          VAR_2: "second variable",
          VAR_3: "third variable",
        });
        const results = resolveAll(ctx);
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
        const results = resolveAll(ctx);
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
        const results = resolveAll(ctx, envs);
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
        const results = resolveAll(ctx, envs);
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
        const results = resolveAll(ctx, envs);
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
        const results = resolveAll(ctx, envs);
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
        const results = resolveAll(ctx, envs);
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
        const results = resolveAll(ctx);
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
          expect(() => resolveAll(ctx)).to.throw(InvalidVariableName).actual;
        expect(err.varname).to.equal("1_BAD_VAR");
      });
    });
  });
});
