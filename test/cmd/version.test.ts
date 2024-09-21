/** */

import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { configure, type LogRecord, reset } from "@logtape/logtape";
import { simpleFormatter } from "../../src/util/logging.ts";

import * as colors from "@std/fmt/colors";
import pkg from "../../deno.json" with { type: "json" };
import { _internals, VersionCommand } from "../../src/cmd/version.ts";
import { expect, mock } from "../setup.ts";

describe("cmd/version", () => {
  let buffer: string[];

  beforeEach(async () => {
    buffer = [];

    await configure({
      sinks: {
        buffer: (record: LogRecord) => {
          buffer.push(simpleFormatter(record));
        },
      },
      loggers: [
        {
          category: ["logtape", "meta"],
          level: "fatal",
        },
        {
          category: ["app"],
          sinks: ["buffer"],
          level: "debug",
        },
      ],
    });
  });
  afterEach(async () => {
    await reset();
  });

  describe("class VersionCommand", () => {
    let cmd: VersionCommand;
    let spyHandler: mock.Spy;

    beforeEach(() => {
      spyHandler = mock.spy(_internals, "handler");
      cmd = new VersionCommand();
    });

    afterEach(() => {
      spyHandler.restore();
    });

    it("constructs the command", () => {
      expect(cmd.getDescription()).to.equal(
        "Show the current version information",
      );
    });
    it("runs the handler on parse()", async () => {
      await cmd.parse([]);

      expect(spyHandler).to.have.been.called();
      expect(buffer.length).to.equal(2);
      expect(buffer[0]).to.equal(
        `${colors.bold(colors.white(pkg.short_name))} ${
          colors.bold(colors.blue(pkg.version))
        }`,
      );
      expect(buffer[1]).to.equal(`
Runtime:
    Deno:     ${Deno.version.deno}
    Platform: ${Deno.build.arch}-${Deno.build.os}
`);
    });
  });
});
