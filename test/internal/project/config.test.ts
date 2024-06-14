import { describe, it } from "@std/testing/bdd";
import { expect } from "../../setup.ts";
import { deepMerge } from "@std/collections";

import { DEFAULTS, parse } from "../../../src/internal/project/config.ts";

describe("internal/project/config", () => {
  describe("parse()", () => {
    it("parses an empty object", () => {
      const result = parse("//project-1", {});
      expect(result).to.deep.equal({
        ...DEFAULTS,
        path: "//project-1",
      });
    });
    it("parses with some fields", () => {
      const result = parse("//project-1", {
        defaults: {
          task: ":build",
        },
      });
      expect(result).to.deep.equal(deepMerge(DEFAULTS, {
        path: "//project-1",
        defaults: {
          task: ":build",
        },
      }));
    });
    it("parses a full config", () => {
      const result = parse("//", {
        root: true,
        defaults: {
          task: ":build",
        },
        tasks: {
          ":build": {},
        },
      });
      expect(result).to.deep.equal({
        path: "//",
        root: true,
        defaults: {
          task: ":build",
        },
        tasks: {
          ":build": {
            name: ":build",
            desc: "",
            deps: [],
          },
        },
      });
    });
  });
});
