/** */

import { afterEach, beforeEach, describe, it } from "deno_std/testing/bdd.ts";
import { expect, mock } from "../mocking.ts";

import { _internals, Resolver } from "../../src/projects/resolver.ts";
import { ConfigNotFound } from "../../src/errors.ts";

describe("projects/resolver", () => {
  describe("ctor", () => {
    it("creates a uninitialized Resolver", () => {
      const result = new Resolver("/some/working/dir");
      expect(result.workingDir).to.equal("/some/working/dir");
      expect(result.rootDir).to.equal("");
      expect(result.root).to.be.undefined();
      expect(result.projects).to.deep.equal([]);
      expect(result.initialized).to.be.false();
    });
  });

  describe(".init()", () => {
    const workingDir = "/devel/root/working";
    let resolver: Resolver;
    let loadStub: mock.Stub;

    beforeEach(() => {
      resolver = new Resolver(workingDir);
    });

    afterEach(() => {
      loadStub && !loadStub.restored && loadStub.restore();
    });

    it("initializes when workingDir === rootDir", async () => {
      loadStub = mock.stub(
        _internals,
        "load",
        (path: string) =>
          Promise.resolve({
            path,
            root: true,
          }),
      );

      await resolver.init();
      expect(resolver.initialized).to.be.true();
      expect(resolver.rootDir).to.equal(resolver.workingDir);
      expect(resolver.projects.length).to.equal(1);
      expect(loadStub).to.have.been.deep.calledWith([workingDir]);
    });
    it("throws if no config is found", async () => {
      loadStub = mock.stub(_internals, "load", () => Promise.resolve(undefined));

      const err = (await expect(resolver.init()).to.be.rejectedWith(ConfigNotFound)).actual;
      expect(err.path).to.equal(workingDir);
    });
  });
});
