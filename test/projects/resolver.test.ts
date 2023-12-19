/** */

import { afterEach, beforeEach, describe, it } from "deno_std/testing/bdd.ts";
import { expect, mock } from "../mocking.ts";

import { basename, join } from "deno_std/path/mod.ts";
import { _internals, create, ProjectResolver, ResolverImpl } from "../../src/projects/resolver.ts";
import { ConfigNotFound, InvalidTaskPath } from "../../src/errors.ts";
import { TaskPath } from "../../src/tasks/path.ts";

describe("projects/resolver", () => {
  describe("ctor", () => {
    it("creates a uninitialized Resolver", () => {
      const result = new ResolverImpl("/some/working/dir");
      expect(result.workingDir).to.equal("/some/working/dir");
      expect(result.workingPath).to.deep.equal(new TaskPath("//"));
      expect(result.rootDir).to.equal("");
      expect(result.rootProject).to.be.undefined();
      expect(result.projects).to.deep.equal([]);
      expect(result.initialized).to.be.false();
    });
  });

  describe(".init()", () => {
    const workingDir = "/devel/root/working";
    const rootDir = "/devel";
    let resolver: ResolverImpl;
    let loadStub: mock.Stub;

    beforeEach(() => {
      resolver = new ResolverImpl(workingDir);
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
      expect(resolver.workingPath).to.deep.equal(new TaskPath("//"));

      const {
        projects,
      } = resolver;
      expect(projects.length).to.equal(1);
      expect(projects[0]).to.equal(resolver.rootProject);

      expect(loadStub).to.have.been.deep.calledWith([workingDir]);
    });
    it("initializes when rootDir is an ancestor of workingDir", async () => {
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
      expect(resolver.workingPath).to.deep.equal(
        new TaskPath("//root/working"),
      );
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
    let resolver: ResolverImpl;
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

      resolver = await create(workingDir) as ResolverImpl;
    });
    afterEach(() => {
      loadStub && !loadStub.restored && loadStub.restore();
    });

    it("resolves already-opened root project", async () => {
      const result = await resolver.open("//");
      const root = resolver.rootProject;
      expect(result).to.equal(root);
    });
    it("resolves a new sub-project", async () => {
      const result = await resolver.open("sub-working");
      const [root, working] = resolver.projects;
      expect(result.root).to.be.false();
      expect(result.path).to.equal("//working/sub-working");
      expect(result.parent).to.equal(working);
      expect(result.parent!.parent).to.equal(root);
    });
    it("resolves a new sibling project", async () => {
      const result = await resolver.open("../sibling");
      expect(result.root).to.be.false();
      expect(result.path).to.equal("//sibling");
      expect(result.parent).to.equal(resolver.rootProject);
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

  describe(".forPath()", () => {
    let resolver: ResolverImpl;
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

      resolver = await create(workingDir) as ResolverImpl;
    });
    afterEach(() => {
      loadStub && !loadStub.restored && loadStub.restore();
    });

    it("creates a new resolver for relative path string", () => {
      const result = resolver.forPath("../sibling");
      expect(result.workingDir).to.equal("/devel/root/sibling");
      expect(result.workingPath).to.deep.equal(new TaskPath("//sibling"));
      expect(result.rootProject).to.equal(resolver.rootProject);
      expect(result.rootDir).to.equal(resolver.rootDir);
      expect(result.projects).to.deep.equal(result.projects);
    });
    it("creates a new resolver for a relative TaskPath", () => {
      const result = resolver.forPath(new TaskPath("../sibling"));
      expect(result.workingDir).to.equal("/devel/root/sibling");
      expect(result.workingPath).to.deep.equal(new TaskPath("//sibling"));
      expect(result.rootProject).to.equal(resolver.rootProject);
      expect(result.rootDir).to.equal(resolver.rootDir);
      expect(result.projects).to.deep.equal(result.projects);
    });

    it("creates a new resolver for a root path string", () => {
      const result = resolver.forPath("//sibling");
      expect(result.workingDir).to.equal("/devel/root/sibling");
      expect(result.workingPath).to.deep.equal(new TaskPath("//sibling"));
      expect(result.rootProject).to.equal(resolver.rootProject);
      expect(result.rootDir).to.equal(resolver.rootDir);
      expect(result.projects).to.deep.equal(result.projects);
    });
    it("creates a new resolver for a root TaskPath", () => {
      const result = resolver.forPath(new TaskPath("//sibling"));
      expect(result.workingDir).to.equal("/devel/root/sibling");
      expect(result.workingPath).to.deep.equal(new TaskPath("//sibling"));
      expect(result.rootProject).to.equal(resolver.rootProject);
      expect(result.rootDir).to.equal(resolver.rootDir);
      expect(result.projects).to.deep.equal(result.projects);
    });

    describe("shared resolving", () => {
      let subResolver: ResolverImpl;

      beforeEach(() => {
        subResolver = resolver.forPath("../sibling");
      });

      it("shares data between resolvers", async () => {
        const result = await subResolver.open("./");
        expect(result.path).to.equal("//sibling");

        const projects = resolver.projects;
        const subProjects = subResolver.projects;
        expect(subProjects.find((p) => p.path === "//sibling")).to.equal(
          result,
        );
        expect(projects.find((p) => p.path === "//sibling")).to.equal(result);
        expect(subProjects.length).to.equal(projects.length);
        for (let idx = 0; idx < projects.length; idx++) {
          expect(subProjects[idx]).to.equal(projects[idx]);
        }
      });
    });

    it("throws if path is absolute", () => {
      const err = (expect(() => resolver.forPath("/absolute/path")).to.throw(
        InvalidTaskPath,
      )).actual;
      expect(err.path).to.equal("/absolute/path");
    });
  });
});
