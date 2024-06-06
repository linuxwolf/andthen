import { describe, it } from "@std/testing/bdd";
import { expect } from "expecto/index.ts";

import { main } from "../src/main.ts";
import pkg from "../deno.json" with { type: "json" };

describe("main", () => {
  describe("main()", () => {
    it("creates the entrypoint command", () => {
      const result = main();
      expect(result).to.exist();
      expect(result.getName()).to.equal(pkg.name.split("/")[1]);
      expect(result.getVersion()).to.equal(pkg.version);
    });
  });
});
