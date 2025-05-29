/**
 * @copyright © Authors of @linuxwolf/andthen (see AUTHORS)
 */

import { describe, it } from "@std/testing/bdd";
// import { expect } from "./setup.ts";

import { main } from "../src/main.ts";

describe("main", () => {
  it("runs the main()", async () => {
    await main();
  });
});
