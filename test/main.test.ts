/** */

import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { expect, mock } from "./setup.ts";

import pkg from "../deno.json" with { type: "json" };
import { Command } from "@cliffy/command";
import { HelpCommand } from "@cliffy/command/help";
import { VersionCommand } from "../src/cmd/version.ts";
import { _internals, command, main } from "../src/main.ts";

describe("main", () => {
  describe("command()", () => {
    it("returns the command", () => {
      const cmd = command();
      expect(cmd.getName()).to.equal(pkg.short_name);
      expect(cmd.getVersion()).to.equal(pkg.version);

      let opt;
      opt = cmd.getOption("verbose");
      expect(opt?.description).to.equal("also print debug logs");
      expect(opt?.conflicts).to.deep.equal(["quiet"]);
      expect(opt?.global).to.be.true();

      opt = cmd.getOption("quiet");
      expect(opt?.description).to.equal("only print warnings and errors");
      expect(opt?.conflicts).to.deep.equal(["verbose"]);
      expect(opt?.global).to.be.true();
    });
  });

  describe("main()", () => {
    let spyCommand: mock.Spy;
    let spyInitialize: mock.Spy;
    let spyParse: mock.Spy;
    let spyHelpExecute: mock.Spy;
    let spyVersionExecute: mock.Spy;

    beforeEach(() => {
      spyCommand = mock.spy(_internals, "command");
      spyInitialize = mock.spy(_internals, "initialize");
      spyParse = mock.spy(Command.prototype, "parse");

      // deno-lint-ignore no-explicit-any -- stubbing "private" method
      spyHelpExecute = mock.stub(HelpCommand.prototype as any, "execute");
      // deno-lint-ignore no-explicit-any -- stubbing "private" method
      spyVersionExecute = mock.stub(VersionCommand.prototype as any, "execute");
    });

    afterEach(() => {
      spyCommand.restore();
      spyInitialize.restore();
      spyParse.restore();
      spyHelpExecute.restore();
      spyVersionExecute.restore();
    });

    it("executes main with `help`", async () => {
      _internals.runnit = true;
      _internals.arguments = ["help"];

      await main();

      expect(spyCommand).to.have.been.called();
      expect(spyParse).to.have.been.called();
      expect(spyHelpExecute).to.have.been.called();
    });

    it("executes main with `version`", async () => {
      _internals.runnit = true;
      _internals.arguments = ["version"];

      await main();

      expect(spyCommand).to.have.been.called();
      expect(spyParse).to.have.been.called();
      expect(spyVersionExecute).to.have.been.called();
    });

    it("executes main with no command", async () => {
      _internals.runnit = true;
      _internals.arguments = [];

      await main();

      expect(spyCommand).to.have.been.called();
      expect(spyParse).to.have.been.called();
    });
  });
});
