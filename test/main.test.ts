import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { expect, mock } from "./setup.ts";

import { _internals, main } from "../src/main.ts";
import pkg from "../deno.json" with { type: "json" };

describe("main", () => {
  describe("main()", () => {
    let findSpy: mock.Spy;

    beforeEach(() => {
      findSpy = mock.spy(_internals, "find");
    });

    afterEach(() => {
      findSpy.restore();
    });

    it("creates the entrypoint command", () => {
      const result = main();
      expect(result).to.exist();
      expect(result.getName()).to.equal(pkg.name.split("/")[1]);
      expect(result.getVersion()).to.equal(pkg.version);

      const subCmd = result.getCommand("find");
      expect(subCmd).to.exist();
      expect(findSpy).to.have.been.called();
    });
  });
});
