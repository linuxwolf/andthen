import { beforeEach, describe, expect, it } from "../deps.ts";

import { MutableVariableContext, TerminalContextError, VariableContext } from "../../src/util/vars.ts";

describe("util/vars", () => {
  describe("VariableContext", () => {
    describe("ctor", () => {
      it("constructs empty", () => {
        let result: VariableContext;

        result = new VariableContext({});
        expect(result.all()).to.deep.equal({});

        result = new VariableContext(new Map());
        expect(result.all()).to.deep.equal({});
      });
      it("constructs with a vars object", () => {
        const result = new VariableContext({
          "SIMPLE": "a simple value",
          "MixedCase": "a mixed case variable",
        });
        expect(result.all()).to.deep.equal({
          "SIMPLE": "a simple value",
          "MixedCase": "a mixed case variable",
        });
      });
      it("constructs with a vars map", () => {
        const mapping = new Map<string, string>([
          ["SIMPLE", "a simple value"],
          ["MixedCase", "a mixed case variable"],
        ]);
        const result = new VariableContext(mapping);
        expect(result.all()).to.deep.equal({
          "SIMPLE": "a simple value",
          "MixedCase": "a mixed case variable",
        });
        mapping.set("ANOTHER", "another value");
        expect(result.all()).to.deep.equal({
          "SIMPLE": "a simple value",
          "MixedCase": "a mixed case variable",
        });
      });
    });

    describe("get())", () => {
      let ctx: VariableContext;

      beforeEach(() => {
        ctx = new VariableContext({
          "SIMPLE": "a simple value",
          "MixedCase": "a mixed case variable",
        });
      });

      it("gets values set at construction", () => {
        expect(ctx.get("SIMPLE")).to.equal("a simple value");
        expect(ctx.get("MixedCase")).to.equal("a mixed case variable");
        expect(ctx.get("UNMAPPED")).to.be.undefined;
      });
    });

    describe("push()", () => {
      let root: VariableContext;

      beforeEach(() => {
        root = new VariableContext({
          "SIMPLE": "a simple value",
          "MixedCase": "a mixed case variable",
        });
      });

      it("pushes an empty context", () => {
        const result = root.push({});
        expect(result).to.not.equal(root);
        expect(result.parent).to.equal(root);
        expect(result.all()).to.deep.equal({});
        expect(result.get("SIMPLE")).to.equal("a simple value");
        expect(result.get("MixedCase")).to.equal("a mixed case variable");
        expect(result.get("UNMAPPED")).to.be.undefined;
      });
      it("pushes a populated context", () => {
        const result = root.push({
          "SIMPLE": "a simple override",
          "NESTED": "a nested context's value",
        });
        expect(result).to.not.equal(root);
        expect(result.parent).to.equal(root);
        expect(result.all()).to.deep.equal({
          "SIMPLE": "a simple override",
          "NESTED": "a nested context's value",
        });
        expect(result.get("SIMPLE")).to.equal("a simple override");
        expect(result.get("MixedCase")).to.equal("a mixed case variable");
        expect(result.get("NESTED")).to.equal("a nested context's value");
        expect(result.get("UNMAPPED")).to.be.undefined;

        expect(root.get("SIMPLE")).to.equal("a simple value");
        expect(root.get("MixedCase")).to.equal("a mixed case variable");
        expect(root.get("NESTED")).to.be.undefined;
        expect(root.get("UNMAPPED")).to.be.undefined;
      });
    });

    describe("pop()", () => {
      let root: VariableContext;
      let ctx: VariableContext;

      beforeEach(() => {
        root = new VariableContext({
          "SIMPLE": "a simple value",
          "MixedCase": "a mixed case variable",
        });
        ctx = root.push({
          "SIMPLE": "a simple override",
          "NESTED": "a nested context's value",
        });
      });

      it("pops to the parent", () => {
        const result = ctx.pop();
        expect(result).to.equal(root);

        expect(result.get("SIMPLE")).to.equal("a simple value");
        expect(result.get("MixedCase")).to.equal("a mixed case variable");
        expect(result.get("NESTED")).to.be.undefined;
        expect(result.get("UNMAPPED")).to.be.undefined;
      });
      it("throws if popping too far", () => {
        const result = ctx.pop();
        expect(() => result.pop()).to.throw(TerminalContextError);
      });
    });

    describe("evaluate()", () => {
      let ctx: VariableContext;

      beforeEach(() => {
        ctx = new VariableContext({
          "SIMPLE": "a simple value",
          "ENV_VAR": "underscore variable",
          "F8": "letters and digits",
          "_8_TO_9": "underscore with digits",
          "MixedCase": "mixed case variable",
        });
      });

      describe("basics", () => {
        it("returns a mapped value", () => {
          const result = ctx.evaluate("${SIMPLE}");
          expect(result).to.equal("a simple value");
        });
        it("returns undefined for unknown value", () => {
          const result = ctx.evaluate("${UNMAPPED_VALUE}");
          expect(result).to.be.empty;
        });
        it("returns the explicit default for unknown value", () => {
          const result = ctx.evaluate("${UNMAPPED_VALUE:=default}");
          expect(result).to.equal("default");
        });
      });
      describe("escaping", () => {
        it("returns the escaped value unchanged", () => {
          const result = ctx.evaluate("$${SIMPLE}");
          expect(result).to.equal("${SIMPLE}");
        });
        it("escapes the escape", () => {
          const result = ctx.evaluate("$$${SIMPLE}");
          expect(result).to.equal("$a simple value");
        });
        it("escapes the defaul", () => {
          const result = ctx.evaluate("$${UNMAPPED_VALUE:=a default}");
          expect(result).to.equal("${UNMAPPED_VALUE:=a default}");
        });
        it("escapes all the way down", () => {
          const result = ctx.evaluate("$$$${SIMPLE}");
          expect(result).to.equal("$${SIMPLE}");
        });
      });
      describe("embedded", () => {
        it("returns the mapped value in the middle", () => {
          const result = ctx.evaluate("this is ${SIMPLE} to eval");
          expect(result).to.equal("this is a simple value to eval");
        });
        it("returns the unmapped value in the middle", () => {
          const result = ctx.evaluate("this is ${UNMAPPED_VALUE} to eval");
          expect(result).to.equal("this is  to eval");
        });
        it("returns the defaulted value in the middle", () => {
          const result = ctx.evaluate(
            "this is ${UNMAPPED_VALUE:=a default} to eval",
          );
          expect(result).to.equal("this is a default to eval");
        });
        it("returns the escaped value in the middle", () => {
          const result = ctx.evaluate("this is $${SIMPLE} to eval");
          expect(result).to.equal("this is ${SIMPLE} to eval");
        });
        it("returns the complex  escaped value in the middle", () => {
          const result = ctx.evaluate(
            "this is $${UNMAPPED_VALUE:=a default} to eval",
          );
          expect(result).to.equal(
            "this is ${UNMAPPED_VALUE:=a default} to eval",
          );
        });
        it("returns the escaped unescaped value in the middle", () => {
          const result = ctx.evaluate("this is $${${SIMPLE}} to eval");
          expect(result).to.equal("this is ${a simple value} to eval");
        });
        it("returns the escaped unescaped default in the middle", () => {
          const result = ctx.evaluate(
            "this is $${${UNMAPPED_VALUE:=a default}} to eval",
          );
          expect(result).to.equal("this is ${a default} to eval");
        });
      });
    });
  });

  describe("MutableVariableContext", () => {
    describe("set/del", () => {
      let ctx: MutableVariableContext;

      beforeEach(() => {
        ctx = new MutableVariableContext({
          "SIMPLE": "a simple value",
          "MixedCase": "a mixed case variable",
        });
      });

      it("changes values set at contruction", () => {
        ctx.set("SIMPLE", "a different simple value");
        expect(ctx.get("SIMPLE")).to.equal("a different simple value");
        expect(ctx.get("MixedCase")).to.equal("a mixed case variable");
        expect(ctx.get("UNMAPPED")).to.be.undefined;
      });
      it("adds an unset variable", () => {
        ctx.set("UNMAPPED", "previously unmapped");
        expect(ctx.get("SIMPLE")).to.equal("a simple value");
        expect(ctx.get("MixedCase")).to.equal("a mixed case variable");
        expect(ctx.get("UNMAPPED")).to.equal("previously unmapped");
      });
      it("deletes a variable set at construction", () => {
        ctx.del("SIMPLE");
        expect(ctx.get("SIMPLE")).to.be.undefined;
        expect(ctx.get("MixedCase")).to.equal("a mixed case variable");
        expect(ctx.get("UNMAPPED")).to.be.undefined;
      });
      it("no-ops deleting an unset variable", () => {
        expect(() => ctx.del("UNMAPPED")).to.not.throw();
        expect(ctx.get("SIMPLE")).to.equal("a simple value");
        expect(ctx.get("MixedCase")).to.equal("a mixed case variable");
        expect(ctx.get("UNMAPPED")).to.be.undefined;
      });
    });

    describe("asImmutable()", () => {
      let ctx: MutableVariableContext;

      beforeEach(() => {
        ctx = new MutableVariableContext({
          "SIMPLE": "a simple value",
          "MixedCase": "a mixed case variable",
        });
      });

      it("returns an immutable copy", () => {
        const result = ctx.asImmutable();
        expect(result).to.not.equal(ctx);
        expect(result.all()).to.deep.equal(ctx.all());
        expect(result.parent).to.equal(ctx.parent);
      });
    });
  });
});
