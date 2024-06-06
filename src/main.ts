import { Command } from "@cliffy/command";

import pkg from "../deno.json" with { type: "json" };

export function main() {
  const cmd = new Command()
    .name(pkg.name.split("/")[1])
    .version(pkg.version);

  return cmd;
}

if (import.meta.main) {
  main().parse(Deno.args);
}
