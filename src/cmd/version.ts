import { Command } from "@cliffy/command";
import * as colors from "@std/fmt/colors";

import pkg from "../../deno.json" with { type: "json" };

export class VersionCommand extends Command {
  constructor() {
    super();

    return this
      .description("Show the current version information")
      .action(handler);
  }
}

function handler() {
  const exec = colors.bold(colors.white(pkg.short_name));
  const version = colors.bold(colors.blue(pkg.version));

  console.log(`${exec} ${version}`);
}
