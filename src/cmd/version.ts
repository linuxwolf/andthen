import { Command } from "@cliffy/command";
import * as colors from "@std/fmt/colors";

import pkg from "../../deno.json" with { type: "json" };

export interface VersionOptions {
  full?: true | false;
}
export class VersionCommand extends Command<void | Record<string, unknown>> {
  constructor() {
    super();

    return this
      .description("Show the current version information")
      .option("--full", "print long version and metadata")
      .action(handler);
  }
}

function handler(opts: VersionOptions) {
  if (!opts.full) {
    console.log(pkg.version);
  } else {
    const exec = colors.bold(colors.white(pkg.short_name));
    const version = colors.bold(colors.blue(pkg.version));

    console.log(`${exec} ${version}`);
  }
}
