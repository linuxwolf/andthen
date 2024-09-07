/** */

import { describe, it } from "@std/testing/bdd";
import { expect } from "../../setup.ts";

import { from } from "../../../src/core/task/config.ts";

describe("core/task", () => {
  describe("from()", () => {
    it("parses a complete task config", () => {
      const result = from(":some-task", {
        desc: "some task description",
        internal: true,
      });

      expect(result).to.deep.equal({
        name: ":some-task",
        internal: true,
        desc: "some task description",
      });
    });
    it("parses a partial task config", () => {
      const result = from(":some-task", {
        desc: "some task description",
      });

      expect(result).to.deep.equal({
        name: ":some-task",
        internal: false,
        desc: "some task description",
      });
    });
    it("parses an empty task config", () => {
      const result = from(":some-task", {});

      expect(result).to.deep.equal({
        name: ":some-task",
        internal: false,
        desc: "",
      });
    });
  });
});
