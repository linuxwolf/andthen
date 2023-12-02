/** */

import { describe, it } from "deno_std/testing/bdd.ts";
import { expect } from "expecto/index.ts";

import { ErrorBase, format } from "../src/errors.ts";

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
      expect(err.toString()).to.equal("MockError: this is an error");
    });
  });
});
