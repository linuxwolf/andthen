import { Command } from "@cliffy/command";

import { command as find } from "./cmd/find.ts";
import pkg from "../deno.json" with { type: "json" };

export const _internals = {
  find,
};

export function main() {
  const cmd = new Command()
    .name(pkg.name.split("/")[1])
    .version(pkg.version);

  cmd.command("find", _internals.find());

  return cmd;
}

if (import.meta.main) {
  main().parse(Deno.args);
}
