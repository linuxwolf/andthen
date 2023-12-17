/** */

import { afterEach, beforeEach, describe, it } from "deno_std/testing/bdd.ts";
import { expect, mock } from "../mocking.ts";

import { join } from "deno_std/path/join.ts";
import { _internals, Resolver } from "../../src/projects/resolver.ts";
import { ConfigNotFound, InvalidTaskPath } from "../../src/errors.ts";
import { basename } from "deno_std/path/basename.ts";

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

    it("initializes when rootDir is workingDir", async () => {
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

      const {
        projects,
      } = resolver;
      expect(projects.length).to.equal(1);
      expect(projects[0]).to.equal(resolver.root);

      expect(loadStub).to.have.been.deep.calledWith([workingDir]);
    });
    it("initializes when rootDir is an ancestor of workingDir", async () => {
      const rootDir = join(workingDir, "..", "..");
      loadStub = mock.stub(
        _internals,
        "load",
        (path: string) =>
          Promise.resolve({
            path,
            root: path === rootDir,
          }),
      );

      await resolver.init();
      expect(resolver.initialized).to.be.true();
      expect(resolver.rootDir).to.equal(rootDir);
      expect(resolver.projects.length).to.equal(3);
      expect(loadStub).to.have.been.called(3);
      expect(loadStub).to.have.been.calledWith([workingDir]);
      expect(loadStub).to.have.been.calledWith([join(workingDir, "..")]);
      expect(loadStub).to.have.been.calledWith([rootDir]);
    });
    it("throws if no config is found", async () => {
      loadStub = mock.stub(
        _internals,
        "load",
        () => Promise.resolve(undefined),
      );

      const err =
        (await expect(resolver.init()).to.be.rejectedWith(ConfigNotFound))
          .actual;
      expect(err.path).to.equal(workingDir);
    });
  });

  describe(".open()", () => {
    let resolver: Resolver;
    let loadStub: mock.Stub;

    beforeEach(async () => {
      const workingDir = "/devel/root/working";
      const rootDir = "/devel/root";
      loadStub = mock.stub(_internals, "load", (path: string) => {
        if (path.endsWith("/invalid")) {
          return Promise.resolve(undefined);
        }
        return Promise.resolve(
          (path === rootDir)
            ? {
              path,
              desc: "root project",
              root: true,
            }
            : {
              path,
              desc: `${basename(path)} project`,
            },
        );
      });

      resolver = new Resolver(workingDir);
      await resolver.init();
    });
    afterEach(() => {
      loadStub && !loadStub.restored && loadStub.restore();
    });

    it("resolves a new project", async () => {
      const result = await resolver.open("sub-working");
      const [root, working] = resolver.projects;
      expect(result.root).to.be.false();
      expect(result.path).to.equal("//working/sub-working");
      expect(result.parent).to.equal(working);
      expect(result.parent!.parent).to.equal(root);
    });
    it("throws if config not found in specified path", async () => {
      const err = (await expect(resolver.open("invalid")).to.be.rejectedWith(
        ConfigNotFound,
      )).actual;
      expect(err.path).to.equal("working/invalid");
    });
    it("throws if opening an absolute path", async () => {
      const err =
        (await expect(resolver.open("/abs/project")).to.be.rejectedWith(
          InvalidTaskPath,
        )).actual;
      expect(err.path).to.equal("/abs/project");
    });
  });
});
