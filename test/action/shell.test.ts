import { describe, it, beforeEach, afterEach, sinon, expect } from "../deps.ts";

import log from "../../src/log.ts";
import { io } from "../../src/deps.ts";

import { ShellAction } from "../../src/action/shell.ts";
import { ShellError } from "../../src/errors/mod.ts";

interface ProcOptions {
  code?: number,
  stdout?: string,
  stderr?: string,
}
function createProc(opts: ProcOptions): [io.StringWriter, Deno.Process] {
  const stdin = new io.StringWriter();
  const code = opts.code || 0;
  const proc = Object.assign(Object.create(Deno.Process.prototype), {
    pid: 10,
    rid: 10,
    stdin: createStdin(stdin),
    stderr: new io.StringReader(opts.stderr || ""),
    stdout: new io.StringReader(opts.stdout|| ""),

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
    }
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
    let stubRun: sinon.SinonStub | undefined;

    beforeEach(() => {
      stubLogWarning = sinon.stub(log, "warning");
    });
    afterEach(() => {
      stubLogWarning.restore();
      stubRun && stubRun.restore();
    });

    describe(".exec()", () => {
      it("records a successful execution", async () => {
        const [stdin, proc] = createProc({
          stdout: "hello",
        });
        stubRun = sinon.stub(Deno, "run")
                  .returns(proc);
        const action = new ShellAction({
          command: "echo hello",
        });
        const result = await action.exec({});
        expect(result).to.equal("hello");
        expect(stubRun).to.be.calledWith({
          cmd: ["bash", "-s"],
          stdin: "piped",
          stdout: "piped",
          stderr: "piped",
          clearEnv: true,
          env: {},
        });
        expect(stdin.toString()).to.equal(`set -euo pipefail

function andthen_log() {
  echo "$@" >&2
}

echo hello`);
      });
      it("logs stderr", async () => {
        const [_, proc] = createProc({
          stderr:`log line 1
log line 2`,
          stdout: "hello",
        });
        stubRun = sinon.stub(Deno, "run")
            .returns(proc);
        const action = new ShellAction({
          command: "echo hello",
        });
        const result = await action.exec({});
        expect(stubLogWarning).to.be.calledWith("log line 1");
        expect(stubLogWarning).to.be.calledWith("log line 2");
        expect(result).to.equal("hello");
      });
      it("throws on failed execution", async () => {
        const [_, proc] = createProc({
          code: 10,
        });
        stubRun = sinon.stub(Deno, "run").returns(proc);
        const action = new ShellAction({
          command: "echo hello",
        });

        await expect(action.exec({}))
            .to.eventually.be.rejectedWith(ShellError)
            .with.property("code", 10);
      });
    });
  });
});
