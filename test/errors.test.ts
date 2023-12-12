/** */

import { describe, it } from "deno_std/testing/bdd.ts";
import { expect } from "expecto/index.ts";

import {
ConfigNotFound,
  ErrorBase,
  format,
  InvalidLogLevel,
  InvalidRootProject,
  InvalidVariableName,
  MalformedConfig,
} from "../src/errors.ts";

describe("errors", () => {
  describe("format()", () => {
    it("formats with just a message", () => {
      const results = format("this is an error");
      expect(results).to.equal("this is an error");
    });
    it("formats with an empty extras", () => {
      const results = format("this is an error", {});
      expect(results).to.equal("this is an error");
    });
    it("formats with a message and detail", () => {
      const results = format("this is an error", {
        "opt-1": "first option",
        "opt-2": 500,
        "opt-3": false,
      });
      expect(results).to.equal(
        'this is an error (opt-1="first option", opt-2=500, opt-3=false)',
      );
    });
  });

  describe("ErrorBase", () => {
    class MockError extends ErrorBase {
    }

    it("creates an error with no extra", () => {
      const err = new MockError("this is an error");
      expect(err).to.be.instanceOf(Error);
      expect(err.name).to.equal("MockError");
      expect(err.message).to.equal("this is an error");
      expect(err.stack).to.exist();
      expect(err.toString()).to.equal("MockError: this is an error");
    });
    it("creates an error with extra", () => {
      const err = new MockError("this is an error", {
        place: "somewhere",
        status: 500,
      });
      expect(err).to.be.instanceOf(Error);
      expect(err.name).to.equal("MockError");
      expect(err.message).to.equal(
        'this is an error (place="somewhere", status=500)',
      );
      expect(err.stack).to.exist();
      expect(err.toString()).to.equal(
        'MockError: this is an error (place="somewhere", status=500)',
      );
    });
  });

  describe("InvalidLogLevel", () => {
    it("creates a InvalidLogLevel with default message", () => {
      const err = new InvalidLogLevel("invalid");
      expect(err.name).to.equal("InvalidLogLevel");
      expect(err.message).to.equal(
        'invalid log level (level="invalid")',
      );
      expect(err.level).to.equal("invalid");
    });
    it("creates a InvalidLogLevel with custom message", () => {
      const err = new InvalidLogLevel("invalid", "unknown log level");
      expect(err.name).to.equal("InvalidLogLevel");
      expect(err.message).to.equal(
        'unknown log level (level="invalid")',
      );
      expect(err.level).to.equal("invalid");
    });
  });

  describe("InvalidVariableName", () => {
    it("creates a InvalidVariableName with default message", () => {
      const err = new InvalidVariableName("NOT A VAR NAME");
      expect(err.name).to.equal("InvalidVariableName");
      expect(err.message).to.equal(
        'invalid variable name (varname="NOT A VAR NAME")',
      );
      expect(err.varname).to.equal("NOT A VAR NAME");
    });
    it("creates a InvalidVariableName with custom message", () => {
      const err = new InvalidVariableName("NOT A VAR NAME", "bad varname");
      expect(err.name).to.equal("InvalidVariableName");
      expect(err.message).to.equal(
        'bad varname (varname="NOT A VAR NAME")',
      );
      expect(err.varname).to.equal("NOT A VAR NAME");
    });
  });

  describe("InvalidRootProject", () => {
    it("creates a InvalidRootProject with default message", () => {
      const err = new InvalidRootProject("sub-root");
      expect(err.name).to.equal("InvalidRootProject");
      expect(err.message).to.equal(
        'invalid root project (project="sub-root")',
      );
      expect(err.project).to.equal("sub-root");
    });
    it("creates a InvalidRootProject with custom message", () => {
      const err = new InvalidRootProject("sub-root", "sub-project as root");
      expect(err.name).to.equal("InvalidRootProject");
      expect(err.message).to.equal(
        'sub-project as root (project="sub-root")',
      );
      expect(err.project).to.equal("sub-root");
    });
  });

  describe("ConfigNotFound", () => {
    it("creates a ConfigNotFound with default message" , () => {
      const err = new ConfigNotFound("path/without/stuff");
      expect(err.name).to.equal("ConfigNotFound");
      expect(err.message).to.equal(
        `config not found (path="path/without/stuff")`,
      );
      expect(err.path).to.equal("path/without/stuff");
    });
    it("creates a ConfigNotFound with custom message", () => {
      const err = new ConfigNotFound("path/without/stuff", "not a config dir");
      expect(err.name).to.equal("ConfigNotFound");
      expect(err.message).to.equal(
        `not a config dir (path="path/without/stuff")`,
      );
      expect(err.path).to.equal("path/without/stuff");
    });
  });

  describe("MalformedConfig", () => {
    it("creates a MalformedConfig with default message", () => {
      const err = new MalformedConfig("path/with/bad-config");
      expect(err.name).to.equal("MalformedConfig");
      expect(err.message).to.equal(
        `malformed config (path="path/with/bad-config")`,
      );
      expect(err.path).to.equal("path/with/bad-config");
    });
    it("creates a MalformedConfig with custom message", () => {
      const err = new MalformedConfig("path/with/bad-config", "config broken");
      expect(err.name).to.equal("MalformedConfig");
      expect(err.message).to.equal(
        `config broken (path="path/with/bad-config")`,
      );
      expect(err.path).to.equal("path/with/bad-config");
    });
  });
});
