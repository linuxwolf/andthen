/** */

import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { expect, mock } from "./setup.ts";

import { Command } from "@cliffy/command";
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
    let spyParse: mock.Spy;

    beforeEach(() => {
      spyCommand = mock.spy(_internals, "command");
      spyParse = mock.spy(Command.prototype, "parse");
    });

    afterEach(() => {
      spyCommand.restore();
      spyParse.restore();
    });

    it("executes main", async () => {
      _internals.runnit = true;

      await main();

      expect(spyCommand).to.have.been.called();
      expect(spyParse).to.have.been.called();
    });
  });
});
