import { describe, it } from "@std/testing/bdd";
import { expect } from "../../setup.ts";
import { deepMerge } from "@std/collections";

import { DEFAULTS, parse } from "../../../src/internal/project/config.ts";

describe("internal/project", () => {
  describe("parse()", () => {
    it("parses an empty object", () => {
      const result = parse({});
      expect(result).to.deep.equal(DEFAULTS);
    });
    it("parses with some fields", () => {
      const result = parse({
        defaults: {
          task: ":build",
        },
      });
      expect(result).to.deep.equal(deepMerge(DEFAULTS, {
        defaults: {
          task: ":build",
        },
      }));
    });
    it("parses a full config", () => {
      const result = parse({
        root: true,
        defaults: {
          task: ":build",
        },
        tasks: {},
      });
      expect(result).to.deep.equal({
        root: true,
        defaults: {
          task: ":build",
        },
        tasks: {},
      });
    });
  });
});
