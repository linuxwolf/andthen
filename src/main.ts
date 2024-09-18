/**
 * Main entrypoint for program
 *
 * @copyright Matthew A. Miller 2024
 */

import type { Internals } from "./util/types.ts";

import { Command } from "@cliffy/command";
import pkg from "../deno.json" with { type: "json" };

export const _internals: Internals = {
  command,
  main: import.meta.main,
};

export function command(): Command {
  const cmd = new Command()
    .name(pkg.short_name)
    .version(pkg.version);

  return cmd;
}

export async function main() {
  if (!_internals.main) return;

  const cmd = _internals.command();
  await cmd.parse(Deno.args);
}

await main();
