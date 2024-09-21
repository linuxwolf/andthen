/**
 * Main entrypoint for program
 *
 * @copyright Matthew A. Miller 2024
 */

import { Command } from "@cliffy/command";
import { HelpCommand } from "@cliffy/command/help";

import pkg from "../deno.json" with { type: "json" };
import type { InternalsBase } from "./util/types.ts";
import { type LoggingOptions, setup as setupLogging } from "./util/logging.ts";

import { VersionCommand } from "./cmd/version.ts";

interface Internals extends InternalsBase {
  command: () => Command<void | Options>;
  initialize: (opts: LoggingOptions) => Promise<void>;
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

type Options =
  & Record<string, unknown>
  & LoggingOptions;
export function command(): Command<void | Options> {
  const cmd = new Command()
    .name(pkg.short_name)
    .version(pkg.version)
    .versionOption(false)
    // global -- logging
    .globalOption("-q, --quiet", "only print warnings and errors", {
      conflicts: ["verbose"],
    })
    .globalOption("-v, --verbose", "also print debug logs", {
      conflicts: ["quiet"],
    })
    // initializer
    .globalAction(_internals.initialize)
    // sub-commands
    .command("help", new HelpCommand())
    .reset()
    .command("version", new VersionCommand())
    .reset();

  return cmd;
}

async function initialize(opts: LoggingOptions) {
  // configure logging
  await setupLogging(opts);
}

export async function main() {
  if (!_internals.runnit) return;

  const cmd = _internals.command();
  await cmd.parse(_internals.arguments);
}

await main();
