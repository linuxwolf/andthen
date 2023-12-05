/** */

import { describe, it } from "deno_std/testing/bdd.ts";
import { expect } from "expecto/index.ts";

import { ShellAction } from "../../src/actions/shell.ts";

describe("actions/shell", () => {
  describe("ShellAction", () => {
    describe("ctor", () => {
      it("creates a minimal config", () => {
        const result = new ShellAction({
          type: "shell",
          cmd: "echo stuff",
        });

        expect(result.type).to.equal("shell");
        expect(result.cmd).to.equal("echo stuff");
        expect(result.exec).to.equal("");
        expect(result.vars).to.deep.equal({});

        expect(result.toConfig()).to.deep.equal({
          type: "shell",
          cmd: "echo stuff",
        });
      });
      it("creates with a full config", () => {
        const result = new ShellAction({
          type: "shell",
          cmd: "echo stuff",
          exec: "bash",
          vars: {
            VAR_1: "shell action var one",
          },
        });

        expect(result.type).to.equal("shell");
        expect(result.cmd).to.equal("echo stuff");
        expect(result.exec).to.equal("bash");
        expect(result.vars).to.deep.equal({
          VAR_1: "shell action var one",
        });

        expect(result.toConfig()).to.deep.equal({
          type: "shell",
          cmd: "echo stuff",
          exec: "bash",
          vars: {
            VAR_1: "shell action var one",
          },
        });
      });
    });
  });
});
