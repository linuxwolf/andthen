import { Command } from "@cliffy/command";
import * as colors from "@std/fmt/colors";

import pkg from "../../deno.json" with { type: "json" };
import logger from "../util/logging.ts";
import type { InternalsBase } from "../util/types.ts";

interface Internals extends InternalsBase {
  handler: () => void;
}
export const _internals: Internals = {
  handler,
};

export class VersionCommand extends Command {
  constructor() {
    super();

    return this
      .description("Show the current version information")
      .action(_internals.handler);
  }
}

function handler() {
  const exec = colors.bold(colors.white(pkg.short_name));
  const version = colors.bold(colors.blue(pkg.version));

  logger().warn`${exec} ${version}`;
  logger().debug((log) => {
    const version = Deno.version.deno;

    const os = Deno.build.os;
    const arch = Deno.build.arch;
    const platform = `${arch}-${os}`;

    return log`
Runtime:
    Deno:     ${version}
    Platform: ${platform}
`;
  });
}
