import { afterEach, beforeEach, describe, expect, it, sinon } from "../deps.ts";

import { Parser } from "../../src/parser/yaml.ts";

import {
  ProjectLoader,
  Resolver,
  ResolverContext,
} from "../../src/core/resolver.ts";
import { Project, ProjectBuilder } from "../../src/core/project.ts";
import { ConfigMissing, InvalidPath } from "../../src/errors/mod.ts";
import { TargetBuilder, TargetPath } from "../../src/core/target.ts";

describe("core/resolver", () => {
  describe("ProjectLoader", () => {
    let loader: ProjectLoader;

    beforeEach(() => {
      loader = new ProjectLoader();
    });

    describe(".parse()", () => {
      const builder = new ProjectBuilder({
        filepath: "/usr/local/src",
        root: true,
      });
      let loadStub: sinon.SinonStub;

      beforeEach(() => {
        loadStub = sinon.stub(Parser.prototype, "load");
      });
      afterEach(() => {
        loadStub.restore();
      });

      it("results in a ProjectBuilder", async () => {
        loadStub.resolves(builder);

        const result = await loader.parse("/usr/local/src");
        expect(result).to.equal(builder);
        expect(loadStub).to.have.callCount(1);
        expect(loadStub).to.be.calledWith("/usr/local/src");
      });
    });
    describe(".load()", () => {
      const builder = new ProjectBuilder({
        filepath: "/usr/local/src",
        root: true,
      });
      let parseStub: sinon.SinonStub;

      beforeEach(() => {
        parseStub = sinon.stub(loader, "parse");
      });
      afterEach(() => {
        parseStub.restore();
      });

      it("loads a project", async () => {
        parseStub.resolves(builder);
        const result = await loader.load("/usr/local/src");
        expect(result).to.equal(builder);
        expect(parseStub).to.have.callCount(1);
        expect(parseStub).to.be.calledWith("/usr/local/src");
      });
      it("walks directories 'up' to a project", async () => {
        parseStub.withArgs("/usr/local/src/sub")
          .rejects(new ConfigMissing("/usr/local/src/sub"));
        parseStub.withArgs("/usr/local/src")
          .resolves(builder);

        const result = await loader.load("/usr/local/src/sub");
        expect(result).to.equal(builder);
        expect(parseStub).to.have.callCount(2);
        expect(parseStub).to.be.calledWith("/usr/local/src/sub");
        expect(parseStub).to.be.calledWith("/usr/local/src");
      });
      it("fails if no project found", async () => {
        parseStub.rejects(new Deno.errors.NotFound());

        const result = loader.load("/usr/local/src/sub");
        await expect(result).to.be.rejectedWith(ConfigMissing)
          .to.eventually.have.property("filepath", "/usr/local/src/sub");
        expect(parseStub).to.have.callCount(5);
        expect(parseStub).to.be.calledWith("/usr/local/src/sub");
        expect(parseStub).to.be.calledWith("/usr/local/src");
        expect(parseStub).to.be.calledWith("/usr/local");
        expect(parseStub).to.be.calledWith("/usr");
        expect(parseStub).to.be.calledWith("/");
      });
      it("fails if no project found exactly", async () => {
        parseStub.rejects(new Deno.errors.NotFound());

        const result = loader.load("/usr/local/src/sub", true);
        await expect(result).to.be.rejectedWith(ConfigMissing)
          .to.eventually.have.property("filepath", "/usr/local/src/sub");
        expect(parseStub).to.have.callCount(1);
        expect(parseStub).to.be.calledWith("/usr/local/src/sub");
      });
    });
    describe(".build()", () => {
      let subBuilder: ProjectBuilder;
      let rootBuilder: ProjectBuilder;
      let loadStub: sinon.SinonStub;

      beforeEach(() => {
        subBuilder = new ProjectBuilder("/usr/local/src/sub");
        rootBuilder = new ProjectBuilder("/usr/local/src").asRoot(),
          loadStub = sinon.stub(loader, "load");
        loadStub.withArgs("/usr/local/src").resolves(rootBuilder);
        loadStub.withArgs("/usr/local/src/sub").resolves(subBuilder);
      });
      afterEach(() => {
        loadStub.restore();
      });

      it("it builds the root project", async () => {
        const root = rootBuilder.build();
        const result = await loader.build("/usr/local/src");
        expect(result).to.deep.equal(root);
        expect(loadStub).to.have.callCount(1);
        expect(loadStub).to.be.calledWith("/usr/local/src");
      });
      it("builds the root project exactly", async () => {
        const root = rootBuilder.build();
        const result = await loader.build("/usr/local/src", true);
        expect(result).to.deep.equal(root);
        expect(loadStub).to.have.callCount(1);
        expect(loadStub).to.be.calledWith("/usr/local/src", true);
      });

      it("builds the sub and root projects", async () => {
        const root = rootBuilder.build();
        const sub = subBuilder.build(root);

        const result = await loader.build("/usr/local/src/sub", true);
        expect(result).to.deep.equal(sub);
        expect(loadStub).to.have.callCount(2);
        expect(loadStub).to.be.calledWith("/usr/local/src/sub");
        expect(loadStub).to.be.calledWith("/usr/local/src");
      });
      it("builds the sub and root projects exactly", async () => {
        const root = rootBuilder.build();
        const sub = subBuilder.build(root);

        const result = await loader.build("/usr/local/src/sub", true);
        expect(result).to.deep.equal(sub);
        expect(loadStub).to.have.callCount(2);
        expect(loadStub).to.be.calledWith("/usr/local/src/sub", true);
        expect(loadStub).to.be.calledWith("/usr/local/src", false);
      });

      it("makes last successfully loaded project the root", async () => {
        const sub = new ProjectBuilder({ ...subBuilder }).asRoot().build();
        loadStub.withArgs("/usr/local/src").rejects(
          new ConfigMissing("/usr/local/src"),
        );

        const result = await loader.build("/usr/local/src/sub");
        expect(result).to.deep.equal(sub);
        expect(loadStub).to.have.callCount(2);
        expect(loadStub).to.be.calledWith("/usr/local/src/sub");
        expect(loadStub).to.be.calledWith("/usr/local/src");
      });

      it("returns cached projects", async () => {
        const root = rootBuilder.build();
        const sub = subBuilder.build(root);

        let result: Project;
        result = await loader.build("/usr/local/src/sub");
        expect(result).to.deep.equal(sub);

        const cachedSub = result;
        const cachedRoot = cachedSub.parent;
        result = await loader.build("/usr/local/src/sub");
        expect(result).to.equal(cachedSub);
        result = await loader.build("/usr/local/src");
        expect(result).to.equal(cachedRoot);

        expect(loadStub).to.have.callCount(2);
        expect(loadStub).to.be.calledWith("/usr/local/src/sub");
        expect(loadStub).to.be.calledWith("/usr/local/src");
      });
    });
  });

  describe("ResolverContext", () => {
    const root = new ProjectBuilder("/usr/local/src")
      .asRoot()
      .withTarget(new TargetBuilder("test-task"))
      .build();
    const sub1 = new ProjectBuilder("/usr/local/src/sub1")
      .withTarget(new TargetBuilder("test-task"))
      .build(root);
    const sub1_1 = new ProjectBuilder("/usr/local/src/sub1/subsub1")
      .withTarget(new TargetBuilder("test-task"))
      .build(sub1);
    const sub2 = new ProjectBuilder("/usr/local/src/sub2")
      .withTarget(new TargetBuilder("test-task"))
      .build(root);

    let loader: ProjectLoader;
    let buildStub: sinon.SinonStub;

    beforeEach(() => {
      loader = new ProjectLoader();
      buildStub = sinon.stub(loader, "build");
      buildStub.withArgs("/usr/local/src").resolves(root);
      buildStub.withArgs("/usr/local/src/sub1").resolves(sub1);
      buildStub.withArgs("/usr/local/src/sub1/subsub1").resolves(sub1_1);
      buildStub.withArgs("/usr/local/src/sub2").resolves(sub2);
    });

    describe(".targetPath()", () => {
      const ctx = new ResolverContext(loader, sub1);

      it("resolves a relative path based on the current project", () => {
        let result: TargetPath;

        result = ctx.targetPath("test-task");
        expect(result).to.deep.equal(
          new TargetPath("/usr/local/src/sub1:test-task"),
        );

        result = ctx.targetPath("./subsub1:test-task");
        expect(result).to.deep.equal(
          new TargetPath("/usr/local/src/sub1/subsub1:test-task"),
        );

        result = ctx.targetPath("../sub2:test-task");
        expect(result).to.deep.equal(
          new TargetPath("/usr/local/src/sub2:test-task"),
        );
      });
      it("resolves a rooted path", () => {
        let result: TargetPath;

        result = ctx.targetPath("//:test-task");
        expect(result).to.deep.equal(
          new TargetPath("/usr/local/src:test-task"),
        );

        result = ctx.targetPath("//sub1:test-task");
        expect(result).to.deep.equal(
          new TargetPath("/usr/local/src/sub1:test-task"),
        );

        result = ctx.targetPath("//sub1/subsub1:test-task");
        expect(result).to.deep.equal(
          new TargetPath("/usr/local/src/sub1/subsub1:test-task"),
        );

        result = ctx.targetPath("//sub2:test-task");
        expect(result).to.deep.equal(
          new TargetPath("/usr/local/src/sub2:test-task"),
        );
      });
      it("resolves an absolute path within the root project filepath", () => {
        let result: TargetPath;

        result = ctx.targetPath("/usr/local/src/sub1:test-task");
        expect(result).to.deep.equal(
          new TargetPath("/usr/local/src/sub1:test-task"),
        );

        result = ctx.targetPath("/usr/local/src:test-task");
        expect(result).to.deep.equal(
          new TargetPath("/usr/local/src:test-task"),
        );

        result = ctx.targetPath("/usr/local/src/sub1/subsub1:test-task");
        expect(result).to.deep.equal(
          new TargetPath("/usr/local/src/sub1/subsub1:test-task"),
        );
      });
      it("fails if absolute path not within root project path", () => {
        expect(() => {
          ctx.targetPath("/usr/local/share/project:test-target");
        })
          .to.throw(InvalidPath)
          .to.have.property("filepath", "/usr/local/share/project:test-target");
      });
    });

    describe(".resolveProject()", () => {
      let ctx: ResolverContext;

      beforeEach(() => {
        ctx = new ResolverContext(loader, sub1);
      });

      it("loads the requested project", async () => {
        const result = await ctx.resolveProject("/usr/local/src/sub1/subsub1");
        expect(result).to.equal(sub1_1);
      });

      it("returns the current project for its path", async () => {
        const result = await ctx.resolveProject(ctx.current.filepath);
        expect(result).to.equal(ctx.current);
      });

      it("returns the root project for its path", async () => {
        const result = await ctx.resolveProject(root.filepath);
        expect(result).to.equal(root);
      });
    });

    describe(".resolveTarget()", () => {
      let ctx: ResolverContext;

      beforeEach(() => {
        ctx = new ResolverContext(loader, sub1);
      });

      it("loads a target from the current project", async () => {
        const result = await ctx.resolveTarget("test-task");
        expect(result).to.deep.equal(
          new TargetBuilder("test-task").build(sub1),
        );
      });
      it("loads a target from a relative child path", async () => {
        const result = await ctx.resolveTarget("subsub1:test-task");
        expect(result).to.deep.equal(
          new TargetBuilder("test-task").build(sub1_1),
        );
      });
      it("loads a target from a relative sibling path", async () => {
        const result = await ctx.resolveTarget("../sub2:test-task");
        expect(result).to.deep.equal(
          new TargetBuilder("test-task").build(sub2),
        );
      });
      it("loads a target from the parent project", async () => {
        const result = await ctx.resolveTarget("../:test-task");
        expect(result).to.deep.equal(
          new TargetBuilder("test-task").build(sub1.parent!),
        );
      });
      it("loads root's target using a rooted path", async () => {
        const result = await ctx.resolveTarget("//:test-task");
        expect(result).to.deep.equal(
          new TargetBuilder("test-task").build(root),
        );
      });
    });
  });

  describe("Resolver", () => {
    const root = new ProjectBuilder("/usr/local/src").asRoot().build();
    const sub1 = new ProjectBuilder("/usr/local/src/sub1").build(root);
    const sub1_1 = new ProjectBuilder("/usr/local/src/sub1/subsub1").build(
      sub1,
    );
    const sub2 = new ProjectBuilder("/usr/local/src/sub2").build(root);

    let buildStub: sinon.SinonStub;

    beforeEach(() => {
      buildStub = sinon.stub(ProjectLoader.prototype, "build");
      buildStub.withArgs("/usr/local/src").resolves(root);
      buildStub.withArgs("/usr/local/src/sub1").resolves(sub1);
      buildStub.withArgs("/usr/local/src/sub1/subsub1").resolves(sub1_1);
      buildStub.withArgs("/usr/local/src/sub2").resolves(sub2);
    });

    afterEach(() => {
      buildStub.restore();
    });

    describe(".create()", () => {
      it("creates a Resolver from the project root directory", async () => {
        const result = await Resolver.create("/usr/local/src");
        expect(result.root).to.equal(root);
      });
      it("creates a Resolver from a sub-directory", async () => {
        const result = await Resolver.create("/usr/local/src/sub1");
        expect(result.root).to.equal(root);
      });
    });

    describe(".within()/.withinRoot()", () => {
      let resolver: Resolver;

      beforeEach(async () => {
        resolver = await Resolver.create("/usr/local/src");
        buildStub.resetHistory();
      });

      it("creates a context from the given filepath", async () => {
        const result = await resolver.within("/usr/local/src/sub1");
        expect(result.current).to.equal(sub1);
        expect(result.root).to.equal(root);
        expect(buildStub).to.be.calledWith("/usr/local/src/sub1");
      });
      it("creats a context from the given Project", async () => {
        const result = await resolver.within(sub2);
        expect(result.current).to.equal(sub2);
        expect(result.root).to.equal(root);
        expect(buildStub).to.have.not.been.called;
      });
      it("returns the root's context", () => {
        const result = resolver.withinRoot();
        expect(result.current).to.equal(root);
        expect(buildStub).to.have.callCount(0);
      });
    });
  });
});
