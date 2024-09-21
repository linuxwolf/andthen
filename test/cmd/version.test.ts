/** */

import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { expect, mock } from "../setup.ts";

import * as colors from "@std/fmt/colors";
import pkg from "../../deno.json" with { type: "json" };
import { VersionCommand } from "../../src/cmd/version.ts";

describe("cmd/version", () => {
  let buffer: string[];
  let spyConsoleLog: mock.Spy;
  let spyExecPath: mock.Spy;

  beforeEach(() => {
    buffer = [];
    // deno-lint-ignore no-explicit-any
    spyConsoleLog = mock.stub(console, "log", (...args: any[]) => {
      buffer.push(args.join(" "));
    });
    spyExecPath = mock.stub(Deno, "execPath", () => "/test/app/executable");
  });
  afterEach(() => {
    spyConsoleLog.restore();
    spyExecPath.restore();
  });

  describe("class VersionCommand", () => {
    let cmd: VersionCommand;
    let spyHandler: mock.Spy;

    beforeEach(() => {
      // deno-lint-ignore no-explicit-any
      spyHandler = mock.spy(VersionCommand.prototype as any, "execute");
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

    describe("execute", () => {
      it("runs the handler with no options", async () => {
        await cmd.parse([]);

        expect(spyHandler).to.have.been.called();
        expect(buffer.length).to.equal(1);
        expect(buffer[0]).to.equal(pkg.version);
      });
      it("runs the handler with `--full`", async () => {
        await cmd.parse(["--full"]);

        expect(spyHandler).to.have.been.called();
        expect(buffer.length).to.equal(2);
        expect(buffer[0]).to.equal(
          `${colors.bold(colors.white(pkg.short_name))} ${
            colors.bold(colors.blue(pkg.version))
          }`,
        );
        expect(buffer[1]).to.equal(`
Runtime:
    executable ${colors.bold(colors.blue("/test/app/executable"))}
    platform   ${
          colors.bold(colors.blue(Deno.build.arch + "-" + Deno.build.os))
        }`);
      });
    });
  });
});
