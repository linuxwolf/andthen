/** */

import { describe, it } from "deno_std/testing/bdd.ts";
import { expect } from "../mocking.ts";

import { _internals } from "../../src/projects/resolver.ts";

describe("projects/resolver", () => {
  it("is defined", () => {
    expect(_internals).to.exist();
  });
});
