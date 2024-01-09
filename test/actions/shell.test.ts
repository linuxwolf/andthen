/** */

import { afterEach, beforeEach, describe, it } from "deno_std/testing/bdd.ts";
import { expect, mock } from "../mocking.ts";
import log from "../../src/logging.ts";

import { _internals, ShellAction } from "../../src/actions/shell.ts";
import { ActionState } from "../../src/actions/base.ts";
import { ShellActionFailed } from "../../src/errors.ts";

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
            VAR_1: "shell action variable one",
          },
        });

        expect(result.type).to.equal("shell");
        expect(result.cmd).to.equal("echo stuff");
        expect(result.exec).to.equal("bash");
        expect(result.vars).to.deep.equal({
          VAR_1: "shell action variable one",
        });

        expect(result.toConfig()).to.deep.equal({
          type: "shell",
          cmd: "echo stuff",
          exec: "bash",
          vars: {
            VAR_1: "shell action variable one",
          },
        });
      });
    });

    describe(".run()", () => {
      let SpyCommand: mock.ConstructorSpy;
      let spyLogInfo: mock.Spy;
      let spyLogWarn: mock.Spy;

      let state: ActionState;

      beforeEach(() => {
        spyLogInfo = mock.spy(log, "info");
        spyLogWarn = mock.spy(log, "warn");
        SpyCommand = mock.spy(_internals.Command);
        _internals.Command = SpyCommand;

        state = {
          cwd: "/tmp",
          env: {},
        };
      });
      afterEach(() => {
        spyLogWarn.restore();
        spyLogInfo.restore();
        _internals.Command = SpyCommand.original;
      });

      describe("basics", () => {
        it("executes a basic command", async () => {
          const action = new ShellAction({
            type: "shell",
            cmd: "echo hello there",
          });

          const result = await action.run(state);
          expect(result.exported).to.deep.equal({});

          expect(SpyCommand).to.have.been.deep.calledWith([
            Deno.env.get("SHELL"),
            {
              args: ["-euo", "pipefail", "-c", "echo hello there"],
              cwd: state.cwd,
              env: state.env,
              clearEnv: true,
            },
          ]);
          expect(spyLogInfo).to.have.been.deep.calledWith([
            "hello there",
          ]);
        });
        it("captures stderr", async () => {
          const action = new ShellAction({
            type: "shell",
            cmd: "echo hello warn >&2",
          });

          const state = {
            cwd: "/tmp",
            env: {},
          };
          const result = await action.run(state);
          expect(result.exported).to.deep.equal({});

          expect(SpyCommand).to.have.been.deep.calledWith([
            Deno.env.get("SHELL"),
            {
              args: ["-euo", "pipefail", "-c", "echo hello warn >&2"],
              cwd: state.cwd,
              env: state.env,
              clearEnv: true,
            },
          ]);
          expect(spyLogWarn).to.have.been.deep.calledWith([
            "hello warn",
          ]);
        });
        it("runs with explicit shell", async () => {
          const action = new ShellAction({
            type: "shell",
            cmd: "echo hello there",
            exec: "sh",
          });

          const result = await action.run(state);
          expect(result.exported).to.deep.equal({});

          expect(SpyCommand).to.have.been.deep.calledWith([
            "sh",
            {
              args: ["-euo", "pipefail", "-c", "echo hello there"],
              cwd: state.cwd,
              env: state.env,
              clearEnv: true,
            },
          ]);
        });
      });

      describe("errors", () => {
        it("throws if 'cmd' fails", async () => {
          const action = new ShellAction({
            type: "shell",
            cmd: "false",
          });

          const err = (await expect(action.run(state)).to.be.rejectedWith(
            ShellActionFailed,
          )).actual;
          expect(err.command).to.equal("false");
          expect(err.code).to.equal(1);
          expect(err.cause).to.be.undefined();

          expect(SpyCommand).to.have.been.deep.calledWith([
            Deno.env.get("SHELL"),
            {
              args: ["-euo", "pipefail", "-c", "false"],
              cwd: state.cwd,
              env: state.env,
              clearEnv: true,
            },
          ]);
        });

        it("throws if 'exec' fails", async () => {
          const action = new ShellAction({
            type: "shell",
            cmd: "true",
            exec: "/tmp/not-a-real-program",
          });

          const err = (await expect(action.run(state)).to.be.rejectedWith(
            ShellActionFailed,
          )).actual;
          expect(err.command).to.equal("true");
          expect(err.code).to.equal(-1);
          expect(err.cause).to.exist();

          expect(SpyCommand).to.have.been.deep.calledWith([
            "/tmp/not-a-real-program",
            {
              args: ["-euo", "pipefail", "-c", "true"],
              cwd: state.cwd,
              env: state.env,
              clearEnv: true,
            },
          ]);
        });
      });
    });
  });
});
