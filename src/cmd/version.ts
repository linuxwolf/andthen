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

export function platformOS(): string {
  return (Deno.build.os === "darwin") ? "macos" : Deno.build.os;
}
export function platformArch(): string {
  return (Deno.build.arch === "aarch64") ? "arm64" : "amd64";
}

function handler() {
  const exec = colors.bold(colors.white(pkg.short_name));
  const version = colors.bold(colors.blue(pkg.version));

  logger().warn`${exec} ${version}`;
  logger().debug((log) => {
    const version = Deno.version.deno;

    const os = platformOS();
    const arch = platformArch();
    const platform = `${os}-${arch}`;

    return log`
Runtime:
    Deno:     ${version}
    Platform: ${platform}
`;
  });
}
