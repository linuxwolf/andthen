import { describe, it } from "@std/testing/bdd";
import { expect } from "../setup.ts";

import * as errors from "../../src/internal/errors.ts";

describe("internal/errors", () => {
  describe("format()", () => {
    it("returns the message when no details", () => {
      const result = errors.format("some error message");
      expect(result).to.equal("some error message");
    });
    it("returns a formatted string with simple details", () => {
      const timestamp = new Date();
      const result = errors.format("some error message", { path: "/some/path", timestamp });
      expect(result).to.equal(`some error message: ( path: "/some/path", timestamp: ${timestamp.toISOString()} )`);
    });
  });

  describe("ErrorBase", () => {
    class MockError extends errors.ErrorBase {};
    it("creates an ErrorBase with no details", () => {
      const result = new MockError("some mock error");
      expect(result.name).to.equal("MockError");
      expect(result.message).to.equal("some mock error");
      expect(result.stack).to.be.typeOf("string")
        .and.not.empty();
    });
    it("creates an ErrorBase with details", () => {
      const timestamp = new Date();
      const result = new MockError("some mock error", { path: "/some/path", timestamp });
      expect(result.name).to.equal("MockError");
      expect(result.message).to.equal(`some mock error: ( path: \"/some/path\", timestamp: ${timestamp.toISOString()} )`);
      expect(result.stack).to.be.typeOf("string")
        .and.not.empty();
    });
  });

  describe("ProjectNotFound", () => {
    it("creates a ProjectNotFound with default message", () => {
      const result = new errors.ProjectNotFound("/root/no/project")
      expect(result.name).to.equal("ProjectNotFound");
      expect(result.message).to.equal('no project found: ( path: "/root/no/project" )');
    });
    it("creates a ProjectNotFound with custom message", () => {
      const result = new errors.ProjectNotFound("/root/no/project", "could not find a project")
      expect(result.name).to.equal("ProjectNotFound");
      expect(result.message).to.equal('could not find a project: ( path: "/root/no/project" )');
    });
  });
});
