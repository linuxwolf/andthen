import { afterEach, beforeEach, describe, expect, it, sinon } from "../deps.ts";

import log from "../../src/log.ts";
import { io } from "../../src/deps.ts";

import { ShellAction } from "../../src/action/shell.ts";
import { ShellError } from "../../src/errors/mod.ts";

interface ProcOptions {
  code?: number;
  stdout?: string;
  stderr?: string;
}
function createProc(opts: ProcOptions): [io.StringWriter, Deno.Process] {
  const stdin = new io.StringWriter();
  const code = opts.code || 0;
  const proc = Object.assign(Object.create(Deno.Process.prototype), {
    pid: 10,
    rid: 10,
    stdin: createStdin(stdin),
    stderr: new io.StringReader(opts.stderr || ""),
    stdout: new io.StringReader(opts.stdout || ""),

    status() {
      return Promise.resolve({
        success: code === 0,
        code,
      });
    },
    output() {
      return Promise.resolve(this.stdout.bytes());
    },
    stderrOutput() {
      return Promise.resolve(this.stderr.bytes());
    },
  });

  return [stdin, proc];
}

function createStdin(w: io.StringWriter): Deno.Writer | Deno.Closer {
  return Object.assign(w, {
    close() {},
  });
}

describe("action/shell", () => {
  describe("ShellAction", () => {
    let stubLogWarning: sinon.SinonSpy;
    let stubRun: sinon.SinonStub;

    beforeEach(() => {
      stubLogWarning = sinon.stub(log, "warning");
      stubRun = sinon.stub(Deno, "run");
    });
    afterEach(() => {
      stubLogWarning.restore();
      stubRun.restore();
    });

    describe(".exec()", () => {
      const action = new ShellAction({
        command: "echo hello",
      });
      it("records a successful execution", async () => {
        const [stdin, proc] = createProc({
          stdout: "hello",
        });
        stubRun.returns(proc);

        const result = await action.exec({
          cwd: "/usr/local/project",
          env: {},
        });
        expect(result).to.equal("hello");
        expect(stubRun).to.be.calledOnce;
        expect(stubRun).to.be.calledWith({
          cmd: ["bash", "-s"],
          stdin: "piped",
          stderr: "piped",
          stdout: "piped",
          clearEnv: true,
          env: {},
          cwd: "/usr/local/project",
        });
        expect(stdin.toString()).to.equal(`set -euo pipefail

function andthen_log() {
  echo "$@" >&2
}

echo hello`);
        stubRun.restore();
      });

      it("calls with environment variables", async () => {
        const [_, proc] = createProc({
          stdout: "hello",
        });
        stubRun.returns(proc);

        const result = await action.exec({
          cwd: "/usr/local/project",
          env: {
            "FOO": "foo value",
            "BAR": "bar value",
          },
        });
        expect(result).to.equal("hello");
        expect(stubRun).to.be.calledOnce;
        expect(stubRun).to.be.calledWith({
          cmd: ["bash", "-s"],
          stdin: "piped",
          stderr: "piped",
          stdout: "piped",
          clearEnv: true,
          env: {
            "FOO": "foo value",
            "BAR": "bar value",
          },
          cwd: "/usr/local/project",
        });
      });

      it("logs stderr", async () => {
        const [_, proc] = createProc({
          stderr: `log line 1
log line 2`,
          stdout: "hello",
        });
        stubRun.returns(proc);

        const result = await action.exec({
          env: {},
          cwd: "/usr/local/project",
        });
        stubRun.restore();
        expect(stubRun).to.be.calledOnce;
        expect(stubRun).to.be.calledWith({
          cmd: ["bash", "-s"],
          stdin: "piped",
          stderr: "piped",
          stdout: "piped",
          clearEnv: true,
          env: {},
          cwd: "/usr/local/project",
        });
        expect(stubLogWarning).to.be.calledWith("log line 1");
        expect(stubLogWarning).to.be.calledWith("log line 2");
        expect(result).to.equal("hello");
      });

      it("throws on failed execution", async () => {
        const [_, proc] = createProc({
          code: 10,
        });
        stubRun.returns(proc);

        await expect(action.exec({
          env: {},
          cwd: "/usr/local/project",
        }))
          .to.eventually.be.rejectedWith(ShellError)
          .with.property("code", 10);
        expect(stubRun).to.be.calledOnce;
        expect(stubRun).to.be.calledWith({
          cmd: ["bash", "-s"],
          stdin: "piped",
          stderr: "piped",
          stdout: "piped",
          clearEnv: true,
          env: {},
          cwd: "/usr/local/project",
        });
        stubRun.restore();
      });
    });
  });
});
