import { describe, it } from "@std/testing/bdd";
import { expect } from "../../setup.ts";

import { DEFAULTS, parse } from "../../../src/internal/task/config.ts";
import { InvalidTaskNameError } from "../../../src/internal/errors.ts";

describe("internal/task/config", () => {
  describe("parse()", () => {
    it("parses an empty object", () => {
      const result = parse(":build", {});
      expect(result).to.deep.equal({
        ...DEFAULTS,
        name: ":build",
      });
    });
    it("parses with deps", () => {
      const result = parse(":build", {
        deps: [":init", ":prep"],
      });
      expect(result).to.deep.equal({
        ...DEFAULTS,
        deps: [":init", ":prep"],
        name: ":build",
      });
    });
    it("parses with desc", () => {
      const result = parse(":build", {
        desc: "builds the thing",
      });
      expect(result).to.deep.equal({
        ...DEFAULTS,
        desc: "builds the thing",
        name: ":build",
      });
    });
    it("parses a full config", () => {
      const result = parse(":build", {
        desc: "builds the thing",
        deps: [":init", ":prep"],
      });
      expect(result).to.deep.equal({
        name: ":build",
        desc: "builds the thing",
        deps: [":init", ":prep"],
      });
    });

    it("throws if name is invalid", () => {
      const err =
        expect(() => parse("bad name", {})).to.throw(InvalidTaskNameError)
          .actual;
      expect(err.taskName).to.equal("bad name");
    });
  });
});
