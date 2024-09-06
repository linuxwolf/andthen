/** */

import { describe, it } from "@std/testing/bdd";
import { expect } from "./setup.ts";

import pkg from "../deno.json" with { type: "json" };
import { command } from "../src/main.ts";

describe("main", () => {
  describe("command()", () => {
    it("returns the command", () => {
      const cmd = command();
      expect(cmd.getName()).to.equal(pkg.short_name);
      expect(cmd.getVersion()).to.equal(pkg.version);
    });
  });
});
