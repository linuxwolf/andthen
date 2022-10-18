import { describe, expect, it } from "../deps.ts";

import { format, InvalidNameError } from "../../src/util/errs.ts";

describe("util/errs", () => {
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

  describe("InvalidNameError", () => {
    it("creates an InvalidNameError", () => {
      const result = new InvalidNameError("invalid name");
      expect(result).to.be.an.instanceof(Error);
      expect(result.message).to.equal("invalid name: [ value=invalid name ]");
      expect(result.value).to.equal("invalid name");
      expect(result.name).to.equal("InvalidNameError");
    });
    it("creates an InvalidNameError with custom message", () => {
      const result = new InvalidNameError(
        "invalid name",
        "something went wrong",
      );
      expect(result).to.be.an.instanceof(Error);
      expect(result.message).to.equal(
        "something went wrong: [ value=invalid name ]",
      );
      expect(result.value).to.equal("invalid name");
      expect(result.name).to.equal("InvalidNameError");
    });
  });
});
