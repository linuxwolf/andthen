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
