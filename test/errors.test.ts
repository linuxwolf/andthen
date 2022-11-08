import { describe, expect, it } from "./deps.ts";

import {
  DuplicateTarget,
  DuplicateVariable,
  InvalidName,
} from "../src/errors.ts";

describe("errors", () => {
  describe("DuplicateTarget", () => {
    it("constructs the error", () => {
      const err = new DuplicateTarget("dup-task");
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal("duplicate task: [ task=dup-task ]");
      expect(err.task).to.equal("dup-task");
      expect(err.name).to.equal("DuplicateTarget");
    });
  });

  describe("DuplicateVariable", () => {
    it("Constructs a DuplicateVariable", () => {
      const err = new DuplicateVariable("dup_var");
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal("duplicate variable: [ variable=dup_var ]");
      expect(err.variable).to.equal("dup_var");
      expect(err.name).to.equal("DuplicateVariable");
    });
  });

  describe("InvalidName", () => {
    it("creates an InvalidName", () => {
      const result = new InvalidName("invalid name");
      expect(result).to.be.an.instanceof(Error);
      expect(result.message).to.equal("invalid name: [ value=invalid name ]");
      expect(result.value).to.equal("invalid name");
      expect(result.name).to.equal("InvalidName");
    });
    it("creates an InvalidName with custom message", () => {
      const result = new InvalidName(
        "invalid name",
        "something went wrong",
      );
      expect(result).to.be.an.instanceof(Error);
      expect(result.message).to.equal(
        "something went wrong: [ value=invalid name ]",
      );
      expect(result.value).to.equal("invalid name");
      expect(result.name).to.equal("InvalidName");
    });
  });
});
