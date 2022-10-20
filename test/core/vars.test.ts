import { beforeEach, describe, expect, it } from "../deps.ts";

import { Context, Variables, evaluate, DuplicateVariableError } from "../../src/core/vars.ts";

describe("util/vars", () => {
  describe("Variables", () => {
    describe("ctor", () => {
      it("constructs a Variables", () => {
        const all = {
          "SIMPLE": "a simple value",
          "MixedCase": "mixed case variable",
        };
        const result = new Variables(all);
        expect(result.all).to.deep.equal(all);
        expect(result.all).to.not.equal(all);
        expect(() => { result.all["SIMPLE"] = "a new simple value"; }).to.throw();
      });
    });
  });

  describe("evaluate()", () => {
    let ctx: Context;

    beforeEach(() => {
      const parent = {
        variables: new Variables({
          "ROOT_VAR": "a root value",
          "SIMPLE": "a simple root value",
        }),
      };
      ctx = {
        parent,
        variables: new Variables({
          "SIMPLE": "a simple value",
          "ENV_VAR": "underscore variable",
          "F8": "letters and digits",
          "_8_TO_9": "underscore with digits",
          "MixedCase": "mixed case variable",
        }),
      };
    });

    describe("basics", () => {
      it("returns a mapped value", () => {
        const result = evaluate("${SIMPLE}", ctx);
        expect(result).to.equal("a simple value");
      });
      it("returns a context's value", () => {
        const result = evaluate("${ROOT_VAR}", ctx);
        expect(result).to.equal("a root value");
      });
      it("returns undefined for unknown value", () => {
        const result = evaluate("${UNMAPPED_VALUE}", ctx);
        expect(result).to.be.empty;
      });
      it("returns the explicit default for unknown value", () => {
        const result = evaluate("${UNMAPPED_VALUE:=default}", ctx);
        expect(result).to.equal("default");
      });
    });
    describe("escaping", () => {
      it("returns the escaped value unchanged", () => {
        const result = evaluate("$${SIMPLE}", ctx);
        expect(result).to.equal("${SIMPLE}");
      });
      it("escapes the escape", () => {
        const result = evaluate("$$${SIMPLE}", ctx);
        expect(result).to.equal("$a simple value");
      });
      it("escapes the defaul", () => {
        const result = evaluate("$${UNMAPPED_VALUE:=a default}", ctx);
        expect(result).to.equal("${UNMAPPED_VALUE:=a default}");
      });
      it("escapes all the way down", () => {
        const result = evaluate("$$$${SIMPLE}", ctx);
        expect(result).to.equal("$${SIMPLE}");
      });
    });
    describe("embedded", () => {
      it("returns the mapped value in the middle", () => {
        const result = evaluate("this is ${SIMPLE} to eval", ctx);
        expect(result).to.equal("this is a simple value to eval");
      });
      it("returns a context's value in the middle", () => {
        const result = evaluate("this is ${ROOT_VAR} to eval", ctx);
        expect(result).to.equal("this is a root value to eval");
      });
      it("returns the unmapped value in the middle", () => {
        const result = evaluate("this is ${UNMAPPED_VALUE} to eval", ctx);
        expect(result).to.equal("this is  to eval");
      });
      it("returns the defaulted value in the middle", () => {
        const result = evaluate(
          "this is ${UNMAPPED_VALUE:=a default} to eval",
          ctx,
        );
        expect(result).to.equal("this is a default to eval");
      });
      it("returns the escaped value in the middle", () => {
        const result = evaluate("this is $${SIMPLE} to eval", ctx);
        expect(result).to.equal("this is ${SIMPLE} to eval");
      });
      it("returns the complex  escaped value in the middle", () => {
        const result = evaluate(
          "this is $${UNMAPPED_VALUE:=a default} to eval",
          ctx,
        );
        expect(result).to.equal(
          "this is ${UNMAPPED_VALUE:=a default} to eval",
        );
      });
      it("returns the escaped unescaped value in the middle", () => {
        const result = evaluate("this is $${${SIMPLE}} to eval", ctx);
        expect(result).to.equal("this is ${a simple value} to eval");
      });
      it("returns the escaped unescaped default in the middle", () => {
        const result = evaluate(
          "this is $${${UNMAPPED_VALUE:=a default}} to eval",
          ctx,
        );
        expect(result).to.equal("this is ${a default} to eval");
      });
    });
  });

  describe("DuplicateVariableError", () => {
    it("Constructs a DuplicateVariableError", () => {
      const err = new DuplicateVariableError("dup_var");
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal("duplicate variable: [ variable=dup_var ]");
      expect(err.variable).to.equal("dup_var");
      expect(err.name).to.equal("DuplicateVariableError");
    });
  });
});
