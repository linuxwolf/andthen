import { describe, expect, it } from "../deps.ts";

import {
  ConfigMissing,
  DuplicateTarget,
  DuplicateVariable,
  InvalidArgument,
  InvalidFile,
  InvalidName,
  InvalidPath,
  ProjectNotFound,
  ShellError,
  TargetNotFound,
} from "../../src/errors/mod.ts";

describe("errors", () => {
  describe("DuplicateTarget", () => {
    it("constructs a DuplicateTarget", () => {
      const result = new DuplicateTarget("dup-target");
      expect(result.message).to.equal("duplicate target: [ target=dup-target ]");
      expect(result.target).to.equal("dup-target");
      expect(result.name).to.equal("DuplicateTarget");
    });
    it("constructs a Dupliatetarget with custom message", () => {
      const result = new DuplicateTarget("dup-target", "target already seen");
      expect(result.message).to.equal("target already seen: [ target=dup-target ]");
      expect(result.target).to.equal("dup-target");
      expect(result.name).to.equal("DuplicateTarget");
    });
  });

  describe("DuplicateVariable", () => {
    it("constructs a DuplicateVariable", () => {
      const result = new DuplicateVariable("dup_var");
      expect(result.message).to.equal("duplicate variable: [ variable=dup_var ]");
      expect(result.variable).to.equal("dup_var");
      expect(result.name).to.equal("DuplicateVariable");
    });
    it("constructs a DuplicateVariable with custom message", () => {
      const result = new DuplicateVariable("dup_var", "variable already seen");
      expect(result.message).to.equal("variable already seen: [ variable=dup_var ]");
      expect(result.variable).to.equal("dup_var");
      expect(result.name).to.equal("DuplicateVariable");
    });
  });

  describe("InvalidArgumetn", () => {
    it("constructs an InvalidArgument", () => {
      const result = new InvalidArgument("some argument");
      expect(result.message).to.equal("invalid argument: [ arg=some argument ]");
      expect(result.arg).to.equal("some argument");
      expect(result.name).to.equal("InvalidArgument");
    });
    it("create an InvalidArgument with custom message", () => {
      const result = new InvalidArgument("some argument", "argument not expected");
      expect(result.message).to.equal("argument not expected: [ arg=some argument ]");
      expect(result.arg).to.equal("some argument");
      expect(result.name).to.equal("InvalidArgument");
    });
  });

  describe("InvalidName", () => {
    it("constructs an InvalidName", () => {
      const result = new InvalidName("invalid name");
      expect(result.message).to.equal("invalid name: [ value=invalid name ]");
      expect(result.value).to.equal("invalid name");
      expect(result.name).to.equal("InvalidName");
    });
    it("constructs an InvalidName with custom message", () => {
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

  describe("ConfigMissing", () => {
    it("constructs a ConfigMissing", () => {
      const result = new ConfigMissing("bad/path");
      expect(result.message).to.equal(
        "configuration not found: [ filepath=bad/path ]",
      );
      expect(result.filepath).to.equal("bad/path");
      expect(result.name).to.equal("ConfigMissing");
    });
    it("constructs a ConfigMissing with message", () => {
      const result = new ConfigMissing("bad/path", "bad config file");
      expect(result.message).to.equal("bad config file: [ filepath=bad/path ]");
      expect(result.filepath).to.equal("bad/path");
      expect(result.name).to.equal("ConfigMissing");
    });
  });

  describe("InvalidFile", () => {
    it("constructs a InvalidFile", () => {
      const result = new InvalidFile("badfilepath");
      expect(result.message).to.equal("invalid file: [ filepath=badfilepath ]");
      expect(result.filepath).to.equal("badfilepath");
      expect(result.name).to.equal("InvalidFile");
    });
    it("constructs a InvalidFile with custom message", () => {
      const result = new InvalidFile("badfilepath", "bad file object");
      expect(result.message).to.equal(
        "bad file object: [ filepath=badfilepath ]",
      );
      expect(result.filepath).to.equal("badfilepath");
      expect(result.name).to.equal("InvalidFile");
    });
  });

  describe("InvalidPath", () => {
    it("constructs a InvalidPath", () => {
      const result = new InvalidPath("/usr/local/bad-src");
      expect(result.message).to.equal(
        "invalid path: [ filepath=/usr/local/bad-src ]",
      );
      expect(result.filepath).to.equal("/usr/local/bad-src");
      expect(result.name).to.equal("InvalidPath");
    });
    it("constructs a InvalidPath with custom message", () => {
      const result = new InvalidPath(
        "/usr/local/bad-src",
        "path not acceptable",
      );
      expect(result.message).to.equal(
        "path not acceptable: [ filepath=/usr/local/bad-src ]",
      );
      expect(result.filepath).to.equal("/usr/local/bad-src");
      expect(result.name).to.equal("InvalidPath");
    });
  });

  describe("ProjectNotFound", () => {
    it("constructs a ProjectNotFound", () => {
      const result = new ProjectNotFound("/usr/local/src/project");
      expect(result.message).to.equal(
        "project not found: [ project=/usr/local/src/project ]",
      );
      expect(result.project).to.equal("/usr/local/src/project");
      expect(result.name).to.equal("ProjectNotFound");
    });
    it("constructs a ProjectNotFound with custom message", () => {
      const result = new ProjectNotFound(
        "/usr/local/src/project",
        "missing project",
      );
      expect(result.message).to.equal(
        "missing project: [ project=/usr/local/src/project ]",
      );
      expect(result.project).to.equal("/usr/local/src/project");
      expect(result.name).to.equal("ProjectNotFound");
    });
  });

  describe("TargetNotFound", () => {
    it("constructs a TargetNotFound", () => {
      const result = new TargetNotFound("test-target");
      expect(result.message).to.equal(
        "target not found: [ target=test-target ]",
      );
      expect(result.target).to.equal("test-target");
      expect(result.name).to.equal("TargetNotFound");
    });
    it("constructs a TargetNotFound with custom message", () => {
      const result = new TargetNotFound("test-target", "missing target");
      expect(result.message).to.equal(
        "missing target: [ target=test-target ]",
      );
      expect(result.target).to.equal("test-target");
      expect(result.name).to.equal("TargetNotFound");
    });
  });

  describe("ShellError", () => {
    it("constructs a ShellError", () => {
      const result = new ShellError(12);
      expect(result.message).to.equal("shell errored: [ code=12 ]");
      expect(result.code).to.equal(12);
      expect(result.name).to.equal("ShellError");
    });
    it("constructs a ShellError with custom message", () => {
      const result = new ShellError(12, "failure in shell");
      expect(result.message).to.equal("failure in shell: [ code=12 ]");
      expect(result.code).to.equal(12);
      expect(result.name).to.equal("ShellError");
    });
  });
});
