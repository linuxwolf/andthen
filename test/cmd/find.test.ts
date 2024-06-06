import { describe, it } from "@std/testing/bdd";
import { expect } from "expecto/index.ts";

import { Command } from "@cliffy/command";
import { command } from "../../src/cmd/find.ts";

describe("cmd/find", () => {
  describe("command()", () => {
    it("Creates the `find` command", () => {
      const cmd = command();
      expect(cmd).to.be.an.instanceOf(Command);
      expect(cmd.getDescription()).to.equal("find tasks to run");

      let opt;
      opt = cmd.getOption("task-name");
      expect(opt?.typeDefinition).to.equal("<string>");
      expect(opt?.description).to.equal("task name to filter on");
      expect(opt?.collect).to.be.true();

      opt = cmd.getOption("depends-on");
      expect(opt?.typeDefinition).to.equal("<string>");
      expect(opt?.description).to.equal("project path to depend on");
      expect(opt?.collect).to.be.true();

      opt = cmd.getOption("depends-on-file");
      expect(opt?.typeDefinition).to.equal("<string>");
      expect(opt?.description).to.equal("read `depends-on` paths from a file");
      expect(opt?.collect).to.be.true();

      opt = cmd.getOption("depends-on-stdin");
      expect(opt?.description).to.equal("read `depends-on` paths from `stdin`");
      expect(opt?.collect).to.be.undefined();
    });
  });
});
