import { describe, expect, it } from "./deps.ts";

import {
  ConfigNotFound,
  DuplicateTarget,
  DuplicateVariable,
  InvalidFile,
  InvalidName,
} from "../src/errors.ts";

describe("errors", () => {
  describe("DuplicateTarget", () => {
    it("constructs the error", () => {
      const err = new DuplicateTarget("dup-task");
      expect(err.message).to.equal("duplicate task: [ task=dup-task ]");
      expect(err.task).to.equal("dup-task");
      expect(err.name).to.equal("DuplicateTarget");
    });
  });

  describe("DuplicateVariable", () => {
    it("Constructs a DuplicateVariable", () => {
      const err = new DuplicateVariable("dup_var");
      expect(err.message).to.equal("duplicate variable: [ variable=dup_var ]");
      expect(err.variable).to.equal("dup_var");
      expect(err.name).to.equal("DuplicateVariable");
    });
  });

  describe("InvalidName", () => {
    it("creates an InvalidName", () => {
      const result = new InvalidName("invalid name");
      expect(result.message).to.equal("invalid name: [ value=invalid name ]");
      expect(result.value).to.equal("invalid name");
      expect(result.name).to.equal("InvalidName");
    });
    it("creates an InvalidName with custom message", () => {
      const result = new InvalidName(
        "invalid name",
        "something went wrong",
      );
      expect(result.message).to.equal(
        "something went wrong: [ value=invalid name ]",
      );
      expect(result.value).to.equal("invalid name");
      expect(result.name).to.equal("InvalidName");
    });
  });

  describe("ConfigNotFound", () => {
    it("creates a minimal ConfigNotFound", () => {
      const result = new ConfigNotFound();
      expect(result.message).to.equal("configuration not found");
      expect(result.cause).to.be.undefined;
      expect(result.name).to.equal("ConfigNotFound");
    });
    it("creates a minimal ConfigNotFound with message", () => {
      const result = new ConfigNotFound(undefined, "bad config file");
      expect(result.message).to.equal("bad config file");
      expect(result.cause).to.be.undefined;
      expect(result.name).to.equal("ConfigNotFound");
    });
    it("creates a ConfigNotFound with cause", () => {
      const cause = [
        new Error("unspecified error"),
      ]
      const result = new ConfigNotFound(cause);
      expect(result.message).to.equal("configuration not found: [ cause=[Error: unspecified error] ]");
      expect(result.cause).to.equal(cause);
      expect(result.name).to.equal("ConfigNotFound");
    });
    it("creates a ConfigNotFound with cause and message", () => {
      const cause = [
        new Error("unspecified error"),
      ]
      const result = new ConfigNotFound(cause, "bad config file");
      expect(result.message).to.equal("bad config file: [ cause=[Error: unspecified error] ]");
      expect(result.cause).to.equal(cause);
      expect(result.name).to.equal("ConfigNotFound");
    });
  });

  describe("InvalidFile", () => {
    it("constructs a InvalidFile", () => {
      const result = new InvalidFile("badfilepath");
      expect(result.message).to.equal("invalid file: [ file=badfilepath ]");
      expect(result.file).to.equal("badfilepath");
      expect(result.name).to.equal("InvalidFile");
    });
    it("constructs a InvalidFile with custom message", () => {
      const result = new InvalidFile("badfilepath", "bad file object");
      expect(result.message).to.equal("bad file object: [ file=badfilepath ]");
      expect(result.file).to.equal("badfilepath");
      expect(result.name).to.equal("InvalidFile");
    });
  });
});
