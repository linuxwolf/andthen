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
      const result = errors.format("some error message", {
        path: "/some/path",
        timestamp,
      });
      expect(result).to.equal(
        `some error message: ( path: "/some/path", timestamp: ${timestamp.toISOString()} )`,
      );
    });
  });

  describe("ErrorBase", () => {
    class MockError extends errors.ErrorBase {}
    it("creates an ErrorBase with no details", () => {
      const result = new MockError("some mock error");
      expect(result.name).to.equal("MockError");
      expect(result.message).to.equal("some mock error");
      expect(result.stack).to.be.typeOf("string")
        .and.not.empty();
    });
    it("creates an ErrorBase with details", () => {
      const timestamp = new Date();
      const result = new MockError("some mock error", {
        path: "/some/path",
        timestamp,
      });
      expect(result.name).to.equal("MockError");
      expect(result.message).to.equal(
        `some mock error: ( path: \"/some/path\", timestamp: ${timestamp.toISOString()} )`,
      );
      expect(result.stack).to.be.typeOf("string")
        .and.not.empty();
    });
  });

  describe("ProjectNotFoundError", () => {
    it("creates a ProjectNotFoundError with default message", () => {
      const result = new errors.ProjectNotFoundError("/root/no/project");
      expect(result.name).to.equal("ProjectNotFoundError");
      expect(result.message).to.equal(
        'no project found: ( path: "/root/no/project" )',
      );
    });
    it("creates a ProjectNotFoundError with custom message", () => {
      const result = new errors.ProjectNotFoundError(
        "/root/no/project",
        "could not find a project",
      );
      expect(result.name).to.equal("ProjectNotFoundError");
      expect(result.message).to.equal(
        'could not find a project: ( path: "/root/no/project" )',
      );
    });
  });

  describe("NotReadyError", () => {
    it("creates a NotReadyError with default message", () => {
      const result = new errors.NotReadyError();
      expect(result.name).to.equal("NotReadyError");
      expect(result.message).to.equal("not ready");
    });
    it("creates a NotReadyError with custom message", () => {
      const result = new errors.NotReadyError("needs initialization");
      expect(result.name).to.equal("NotReadyError");
      expect(result.message).to.equal("needs initialization");
    });
  });
});
