import { beforeEach, describe, expect, it } from "../deps.ts";

import { Context, environ, evaluate } from "../../src/core/vars.ts";

describe("util/vars", () => {
  describe("environ()", () => {
    let ctx: Context;

    beforeEach(() => {
      const parent = {
        variables: {
          "ROOT_VAR": "a root value",
          "SIMPLE": "a simple root value",
          "SUBST": "${SIMPLE}",
          "F8": "letters and digits",
          "FROM_ENV": "${FROM_ENV}",
        },
      } as Context;
      ctx = {
        parent,
        variables: {
          "SIMPLE": "a simple value",
          "DEFAULTED": "${DEFAULTED:=de fault}",
          "ENV_VAR": "underscore variable",
          "CARRIED": "${SIMPLE}",
          "F8": "from root: ${F8}",
          "_8_TO_9": "underscore with digits",
          "MixedCase": "mixed case variable",
        },
      };
    });
    it("builds the root's environ", () => {
      const result = environ(ctx.parent!, {});
      expect(result).to.deep.equal({
        "ROOT_VAR": "a root value",
        "SIMPLE": "a simple root value",
        "SUBST": "a simple root value",
        "F8": "letters and digits",
        "FROM_ENV": "",
      });
    });
    it("builds the root's environs with overrides", () => {
      const env = {
        "FROM_ENV": "a simple environment variable",
      };
      const result = environ(ctx.parent!, env);
      expect(result).to.deep.equal({
        "ROOT_VAR": "a root value",
        "SIMPLE": "a simple root value",
        "SUBST": "a simple root value",
        "F8": "letters and digits",
        "FROM_ENV": "a simple environment variable",
      });
    });

    it("builds a full environment", () => {
      const result = environ(ctx, {});
      expect(result).to.deep.equal({
        "ROOT_VAR": "a root value",
        "SIMPLE": "a simple value",
        "SUBST": "a simple root value",
        "F8": "from root: letters and digits",
        "FROM_ENV": "",
        "DEFAULTED": "de fault",
        "ENV_VAR": "underscore variable",
        "CARRIED": "a simple value",
        "_8_TO_9": "underscore with digits",
        "MixedCase": "mixed case variable",
      });
    });
    it("builds a full environment with overrides", () => {
      const env = {
        "DEFAULTED": "override default",
        "FROM_ENV": "a simple environment variable",
      };
      const result = environ(ctx, env);
      expect(result).to.deep.equal({
        "ROOT_VAR": "a root value",
        "SIMPLE": "a simple value",
        "SUBST": "a simple root value",
        "F8": "from root: letters and digits",
        "FROM_ENV": "a simple environment variable",
        "DEFAULTED": "override default",
        "ENV_VAR": "underscore variable",
        "CARRIED": "a simple value",
        "_8_TO_9": "underscore with digits",
        "MixedCase": "mixed case variable",
      });
    });
  });

  describe("evaluate()", () => {
    const vars = {
      "SIMPLE": "a simple value",
      "ENV_VAR": "underscore variable",
      "F8": "letters and digits",
      "_8_TO_9": "underscore with digits",
      "MixedCase": "mixed case variable",
    };

    describe("basics", () => {
      it("returns a mapped value", () => {
        const result = evaluate("${SIMPLE}", vars);
        expect(result).to.equal("a simple value");
      });
      it("returns '' for unknown value", () => {
        const result = evaluate("${UNMAPPED_VALUE}", vars);
        expect(result).to.be.empty;
      });
      it("returns the explicit default for unknown value", () => {
        const result = evaluate("${UNMAPPED_VALUE:=default}", vars);
        expect(result).to.equal("default");
      });
    });
    describe("escaping", () => {
      it("returns the escaped value unchanged", () => {
        const result = evaluate("$${SIMPLE}", vars);
        expect(result).to.equal("${SIMPLE}");
      });
      it("escapes the escape", () => {
        const result = evaluate("$$${SIMPLE}", vars);
        expect(result).to.equal("$a simple value");
      });
      it("escapes the defaul", () => {
        const result = evaluate("$${UNMAPPED_VALUE:=a default}", vars);
        expect(result).to.equal("${UNMAPPED_VALUE:=a default}");
      });
      it("escapes all the way down", () => {
        const result = evaluate("$$$${SIMPLE}", vars);
        expect(result).to.equal("$${SIMPLE}");
      });
    });
    describe("embedded", () => {
      it("returns the mapped value in the middle", () => {
        const result = evaluate("this is ${SIMPLE} to eval", vars);
        expect(result).to.equal("this is a simple value to eval");
      });
      it("returns the unmapped value in the middle", () => {
        const result = evaluate("this is ${UNMAPPED_VALUE} to eval", vars);
        expect(result).to.equal("this is  to eval");
      });
      it("returns the defaulted value in the middle", () => {
        const result = evaluate(
          "this is ${UNMAPPED_VALUE:=a default} to eval",
          vars,
        );
        expect(result).to.equal("this is a default to eval");
      });
      it("returns the escaped value in the middle", () => {
        const result = evaluate("this is $${SIMPLE} to eval", vars);
        expect(result).to.equal("this is ${SIMPLE} to eval");
      });
      it("returns the complex  escaped value in the middle", () => {
        const result = evaluate(
          "this is $${UNMAPPED_VALUE:=a default} to eval",
          vars,
        );
        expect(result).to.equal(
          "this is ${UNMAPPED_VALUE:=a default} to eval",
        );
      });
      it("returns the escaped unescaped value in the middle", () => {
        const result = evaluate("this is $${${SIMPLE}} to eval", vars);
        expect(result).to.equal("this is ${a simple value} to eval");
      });
      it("returns the escaped unescaped default in the middle", () => {
        const result = evaluate(
          "this is $${${UNMAPPED_VALUE:=a default}} to eval",
          vars,
        );
        expect(result).to.equal("this is ${a default} to eval");
      });
    });
  });
});
