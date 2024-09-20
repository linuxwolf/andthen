/** */

import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { expect, mock } from "./setup.ts";

import { Command } from "@cliffy/command";
import { HelpCommand } from "@cliffy/command/help";
import pkg from "../deno.json" with { type: "json" };
import { _internals, command, main } from "../src/main.ts";

describe("main", () => {
  describe("command()", () => {
    it("returns the command", () => {
      const cmd = command();
      expect(cmd.getName()).to.equal(pkg.short_name);
      expect(cmd.getVersion()).to.equal(pkg.version);
    });
  });

  describe("main()", () => {
    let spyCommand: mock.Spy;
    let spyInitialize: mock.Spy;
    let spyParse: mock.Spy;
    let spyHelpExecute: mock.Spy;

    beforeEach(() => {
      spyCommand = mock.spy(_internals, "command");
      spyInitialize = mock.spy(_internals, "initialize");
      spyParse = mock.spy(Command.prototype, "parse");

      // deno-lint-ignore no-explicit-any -- stubbing "private" method
      spyHelpExecute = mock.stub(HelpCommand.prototype as any, "execute");
    });

    afterEach(() => {
      spyCommand.restore();
      spyInitialize.restore();
      spyParse.restore();
      spyHelpExecute.restore();
    });

    /*
    it("executes main with no command", async () => {
      _internals.runnit = true;
      _internals.arguments = [];

      await main();

      expect(spyCommand).to.have.been.called();
      expect(spyParse).to.have.been.called();
      expect(spyFallback).to.have.been.called();
    });
    //*/

    it("executes main with `help`", async () => {
      _internals.runnit = true;
      _internals.arguments = ["help"];

      await main();

      expect(spyCommand).to.have.been.called();
      expect(spyParse).to.have.been.called();
      expect(spyHelpExecute).to.have.been.called();
    });
  });
});
