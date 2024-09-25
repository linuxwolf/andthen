/** */

import { describe, it } from "@std/testing/bdd";
import { expect } from "../../setup.ts";

import { from } from "../../../src/core/project/config.ts";

describe("core/project/config", () => {
  describe("from()", () => {
    it("parses a complete project config", () => {
      const result = from("//server", {
        root: true,
        tasks: {
          ":build": {
            desc: "build some project",
            internal: false,
          },
          ":compile": {
            desc: "compile some thing",
            internal: true,
          },
        },
      });

      expect(result).to.deep.equal({
        path: "//server",
        root: true,
        tasks: {
          "//server:build": {
            name: ":build",
            desc: "build some project",
            internal: false,
          },
          "//server:compile": {
            name: ":compile",
            desc: "compile some thing",
            internal: true,
          },
        },
      });
    });
    it("parses a partial project", () => {
      const result = from("//server", {
        tasks: {
          ":build": {
            desc: "build some project",
          },
          ":compile": {},
        },
      });

      expect(result).to.deep.equal({
        path: "//server",
        root: false,
        tasks: {
          "//server:build": {
            name: ":build",
            desc: "build some project",
            internal: false,
          },
          "//server:compile": {
            name: ":compile",
            desc: "",
            internal: false,
          },
        },
      });
    });
    it("parses an empty project", () => {
      const result = from("//server", {});

      expect(result).to.deep.equal({
        path: "//server",
        root: false,
        tasks: {},
      });
    });
  });
});
