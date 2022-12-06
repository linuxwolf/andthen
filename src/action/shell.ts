import { io } from "../deps.ts";
import log from "../log.ts";
import { ShellError } from "../errors/mod.ts";
import { ActionContext } from "./types.ts";

export interface ShellActionOpts {
  command: string;
}

const SHELL_CMD = ["bash", "-s"];
export class ShellAction {
  readonly command: string;

  constructor(opts: ShellActionOpts) {
    this.command = opts.command;
  }

  async exec(ctx: ActionContext): Promise<string> {
    const script = `set -euo pipefail

function andthen_log() {
  echo "$@" >&2
}

${this.command}`;

    const { env, cwd } = ctx;
    const proc = Deno.run({
      cmd: SHELL_CMD,
      stdin: "piped",
      stderr: "piped",
      stdout: "piped",
      clearEnv: true,
      env,
      cwd,
    });
    await proc.stdin.write(new TextEncoder().encode(script));
    proc.stdin.close();

    // read stderr as it arrives
    const loggit = (async () => {
      for await (const line of io.readLines(proc.stderr)) {
        log.warning(line);
      }
    })();

    // await completion then grab all of stdout
    const status = await proc.status();
    const output = new TextDecoder().decode(await proc.output());
    // make sure all of stderr is logged
    await loggit;

    const { success, code } = status;
    if (!success) {
      // TODO: use a dedicated error type
      throw new ShellError(code);
    }
    return output;
  }
}
