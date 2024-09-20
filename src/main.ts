/**
 * Main entrypoint for program
 *
 * @copyright Matthew A. Miller 2024
 */

import { Command } from "@cliffy/command";
import { HelpCommand } from "@cliffy/command/help";

import pkg from "../deno.json" with { type: "json" };
import type { InternalsBase } from "./util/types.ts";
import logger, { type LoggingOptions, setup as setupLogging } from "./util/logging.ts";

interface Internals extends InternalsBase {
  command: () => Command<void | Options>;
  initialize: (opts: Options) => Promise<void>;
  exit: (code?: number) => void;

  runnit: boolean;
  arguments: string[];
}
export const _internals: Internals = {
  command,
  initialize,

  runnit: import.meta.main,
  arguments: Deno.args,
  exit: Deno.exit,
};

type Options = Record<string, unknown>
  & LoggingOptions;
export function command(): Command<void | Options> {
  let cmd = new Command()
    .name(pkg.short_name)
    .version(pkg.version)
    // global -- logging
    .globalOption("-q, --quiet", "only print warnings and errors", {
      conflicts: ["verbose"],
    })
    .globalOption("-v, --verbose", "also print debug events", {
      conflicts: ["quiet"],
    })
    // initializer
    .globalAction(_internals.initialize);

    // sub-commands
    cmd = cmd.command("help", new HelpCommand()).reset();

  return cmd;
}

async function initialize(opts: Options) {
  // configure logging
  await setupLogging(opts);
  const log = logger();
  log.debug`logging configured`;
}

export async function main() {
  if (!_internals.runnit) return;

  const cmd = _internals.command();
  await cmd.parse(_internals.arguments);
}

await main();
