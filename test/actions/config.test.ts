/** */

import { describe, it } from "deno_std/testing/bdd.ts";
import { expect } from "expecto/index.ts";

import { asConfig } from "../../src/actions/config.ts";

describe("actions/config", () => {
  describe("asConfig()", () => {
    describe("for ShellActionConfig", () => {
      it("returns a ShellActionConfig from minimal", () => {
        const result = asConfig({
          shell: "do some cmd",
        });
        expect(result).to.deep.equal({
          shell: "do some cmd",
        });
      });
      it("returns a ShellActionConfig from full", () => {
        const result = asConfig({
          shell: "do some cmd",
          exec: "bash",
          vars: {
            VAR_1: "shell action variable one",
          },
        });
        expect(result).to.deep.equal({
          shell: "do some cmd",
          exec: "bash",
          vars: {
            VAR_1: "shell action variable one",
          },
        });
      });
      it("returns a ShellActionConfig for short syntax", () => {
        const result = asConfig("do some cmd");
        expect(result).to.deep.equal({
          shell: "do some cmd",
        });
      });
    });
    describe("for TaskActionConfig", () => {
      it("returns a TaskActionConfig from minimal", () => {
        const result = asConfig({
          task: ":task-name",
        });
        expect(result).to.deep.equal({
          task: ":task-name",
        });
      });
      it("returns a TaskActionConfig from full", () => {
        const result = asConfig({
          task: ":task-name",
          vars: {
            VAR_1: "task action variable one",
          },
        });
        expect(result).to.deep.equal({
          task: ":task-name",
          vars: {
            VAR_1: "task action variable one",
          },
        });
      });
    });
  });
});
