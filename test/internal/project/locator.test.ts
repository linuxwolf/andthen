import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { expect, mock } from "../../setup.ts";

import { _internals, locate } from "../../../src/internal/project/locator.ts";

function stubReadTextFile(path: string | URL): Promise<string> {
  switch (path.toString()) {
    case "/root/sub-project/andthen.yaml":
      return Promise.resolve(`
tasks:
  :build: {}
  :test: {}
  :doc: {}
`);
    case "/root/andthen.yml":
      return Promise.resolve(`
root: true
tasks:
  :build: {}
  :test: {}
  :doc: {}    
`);
    default:
      return Promise.reject(new Deno.errors.NotFound());
  }
}

describe("internal/locator", () => {
  describe("locate()", () => {
    let spyReadTextFile: mock.Spy;

    beforeEach(() => {
      spyReadTextFile = mock.stub(_internals, "readTextFile", stubReadTextFile);
    });

    afterEach(() => {
      spyReadTextFile.restore();
    });

    it("returns a non-root ProjectConfig", async () => {
      const result = await locate("/root/sub-project");
      expect(result).to.deep.equal({
        path: "/root/sub-project",
        root: false,
        defaults: {
          task: ":default",
        },
        tasks: {
          ":build": {},
          ":test": {},
          ":doc": {},
        },
      });
    });
    it("returns a root ProjectConfig", async () => {
      const result = await locate("/root");
      expect(result).to.deep.equal({
        path: "/root",
        root: true,
        defaults: {
          task: ":default",
        },
        tasks: {
          ":build": {},
          ":test": {},
          ":doc": {},
        },
      })
    });
    it("return undefined when not found", async () => {
      const result = await locate("/elsewhere/project");
      expect(result).to.be.undefined();
    });
  });
});
