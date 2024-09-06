/**
 * Main entrypoint for program
 *
 * @copyright Matthew A. Miller 2024
 */

import { Command } from "@cliffy/command";
import pkg from "../deno.json" with { type: "json" };

export function command(): Command {
  const cmd = new Command()
    .name(pkg.short_name)
    .version(pkg.version);

  return cmd;
}

export async function main() {
  const cmd = command();
  await cmd.parse(Deno.args);
}

if (import.meta.main) {
  await main();
}
