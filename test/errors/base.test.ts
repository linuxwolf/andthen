import { describe, expect, it } from "../deps.ts";

import { ErrBase, format } from "../../src/errors/base.ts";

describe("errs", () => {
  describe("format()", () => {
    it("returns a simple message", () => {
      const result = format("this is the message");
      expect(result).to.equal("this is the message");
    });
    it("returns a message with a single label", () => {
      const extra = {
        value: "invalid value",
      };
      const result = format("something went wrong", extra);
      expect(result).to.equal("something went wrong: [ value=invalid value ]");
    });
    it("returns a mesage with multiple labels", () => {
      const extra = {
        value: "invalid value",
        stamp: "the stamp",
      };
      const result = format("something went wrong", extra);
      expect(result).to.equal(
        "something went wrong: [ value=invalid value; stamp=the stamp ]",
      );
    });
    it("returns a message with mixed type labels", () => {
      const extra = {
        value: "invalid value",
        answer: 42,
        question: null,
      };
      const result = format("something went wrong", extra);
      expect(result).to.equal(
        "something went wrong: [ value=invalid value; answer=42; question=null ]",
      );
    });
    it("returns just the message if there are no labels", () => {
      const extra = {};
      const result = format("something went wrong", extra);
      expect(result).to.equal("something went wrong");
    });

    describe("extra data types", () => {
      it("renders an undefined extra", () => {
        const extra = {
          value: undefined,
        };
        const result = format("something went wrong", extra);
        expect(result).to.equal("something went wrong: [ value=undefined ]");
      });
      it("renders a null extra", () => {
        const extra = {
          value: null,
        };
        const result = format("something went wrong", extra);
        expect(result).to.equal("something went wrong: [ value=null ]");
      });
      it("renders a Date extra", () => {
        const now = new Date();
        const extra = {
          timestamp: now,
        };
        const result = format("something went wrong", extra);
        expect(result).to.equal(
          `something went wrong: [ timestamp=${now.toISOString()} ]`,
        );
      });
      it("renders an Array extra", () => {
        const values = ["foo", "bar", "baz"];
        const extra = { values };
        const result = format("something went wrong", extra);
        expect(result).to.equal(
          "something went wrong: [ values=[foo, bar, baz] ]",
        );
      });
      it("renders a plain object", () => {
        const values = {
          foo: "foo value",
          bar: 42,
        };
        const extra = { values };
        const result = format("something went wrong", extra);
        expect(result).to.equal(
          "something went wrong: [ values={foo: foo value, bar: 42} ]",
        );
      });
    });
    describe("extra nested", () => {
      it("nests an object in an array", () => {
        const now = new Date();
        const details = {
          timestamp: now,
          file: "foo.txt",
        };
        const values = [
          "contrived",
          details,
        ];
        const extra = { values };
        const result = format("something went wrong", extra);
        expect(result).to.equal(
          `something went wrong: [ values=[contrived, {timestamp: ${now.toISOString()}, file: foo.txt}] ]`
        );
      });
    });
  });

  describe("ErrBase", () => {
    class TestError extends ErrBase {
      // deno-lint-ignore no-explicit-any
      constructor(msg: string, extra?: Record<string, any>) {
        super(msg, extra);
      }
    }
    it("creates an ErrBase subclass with no extra", () => {
      const result = new TestError("testing error");
      expect(result).to.be.an.instanceof(Error);
      expect(result.message).to.equal("testing error");
      expect(result.name).to.equal("TestError");
    });
    it("creates an ErrBase subclass with an extra", () => {
      const result = new TestError(
        "something went wrong",
        {
          "key": "value",
        },
      );
      expect(result).to.be.an.instanceof(Error);
      expect(result.message).to.equal(
        "something went wrong: [ key=value ]",
      );
      expect(result.name).to.equal("TestError");
    });
  });
});
