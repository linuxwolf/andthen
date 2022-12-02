import { beforeEach, describe, expect, it } from "../deps.ts";

import { Project, ProjectBuilder } from "../../src/core/project.ts";
import { Target, TargetBuilder } from "../../src/core/target.ts";
import * as errors from "../../src/errors.ts";

describe("core/project", () => {
  describe("Project", () => {
    describe("ctor", () => {
      it("constructs from a full ProjectConfig", () => {
        const cfg = {
          path: "test-project",
          variables: {
            "SIMPLE": "a simple value",
          },
          targets: [
            { name: "test-target" },
          ],
        };
        const result = new Project(cfg);
        expect(result.parent).to.be.undefined;
        expect(result.root).to.be.false;
        expect(result.default).to.equal("default");
        expect(result.path).to.equal(cfg.path);
        expect(result.variables).to.deep.equal({
          "SIMPLE": "a simple value",
        });

        const targets = {
          "test-target": new Target(result, { name: "test-target" }),
        };
        expect(result.targets).to.deep.equal(targets);
      });
      it("constructs with a parent from a full ProjectConfig", () => {
        const parent = new Project({ path: "root" });
        const cfg = {
          root: true,
          default: "test-target",
          path: "test-project",
          variables: {
            "SIMPLE": "a simple value",
          },
          targets: [
            { name: "test-target" },
          ],
        };
        const result = new Project(cfg, parent);
        expect(result.parent).to.equal(parent);
        expect(result.path).to.equal(cfg.path);
        expect(result.root).to.be.true;
        expect(result.default).to.equal("test-target");
        expect(result.variables).to.deep.equal({
          "SIMPLE": "a simple value",
        });

        const targets = {
          "test-target": new Target(result, { name: "test-target" }),
        };
        expect(result.targets).to.deep.equal(targets);
      });
      it("constructs from a minimal ProjectConfig", () => {
        const cfg = {
          path: "test-project",
        };
        const result = new Project(cfg);
        expect(result.parent).to.be.undefined;
        expect(result.path).to.equal(cfg.path);
        expect(result.variables).to.deep.equal({});
        expect(result.targets).to.deep.equal({});
      });
      it("constructs with a parent from a minimal ProjectConfi", () => {
        const parent = new Project({ path: "root" });
        const cfg = {
          path: "test-project",
        };
        const result = new Project(cfg, parent);
        expect(result.parent).to.equal(parent);
        expect(result.path).to.equal(cfg.path);
        expect(result.variables).to.deep.equal({});
        expect(result.targets).to.deep.equal({});
      });
    });
  });

  describe("ProjectBuilder", () => {
    let builder: ProjectBuilder;

    beforeEach(() => {
      builder = new ProjectBuilder("test-project");
    });

    describe("ctor", () => {
      it("constructs an empty ProjectBuilder", () => {
        expect(builder.path).to.equal("test-project");
        expect(builder.variables).to.deep.equal({});
        expect(builder.targets).to.deep.equal([]);
      });
    });

    describe("build root", () => {
      it("sets Project as root implicitly", () => {
        const result = builder.asRoot();
        expect(result).to.equal(builder);
        expect(result.root).to.be.true;
      });

      it("sets Project as root explicitly", () => {
        const result = builder.asRoot(true);
        expect(result).to.equal(builder);
        expect(result.root).to.be.true;
      });
      it("does not set Project as root explicitly", () => {
        const result = builder.asRoot(false);
        expect(result).to.equal(builder);
        expect(result.root).to.be.false;
      });
    });

    describe("buld default target", () => {
      it("sets the default target", () => {
        const result = builder.withDefault("test-target");
        expect(result).to.equal(builder);
        expect(result.default).to.equal("test-target");
      });
      it("fails if default is not a valid target name", () => {
        expect(() => builder.withDefault(""))
          .to.throw(errors.InvalidName)
          .to.have.property("value", "");
        expect(() => builder.withDefault("invalid name"))
          .to.throw(errors.InvalidName)
          .to.have.property("value", "invalid name");
      });
    });

    describe("build variables", () => {
      it("adds a variable", () => {
        const result = builder.withVariable("SIMPLE", "a simple value");
        expect(result).to.equal(builder);
        expect(result.variables).to.deep.equal({
          "SIMPLE": "a simple value",
        });
      });
      it("adds multiple variables", () => {
        const result = builder.withVariable("SIMPLE", "a simple value")
          .withVariable("MAPPED", "a mapped value")
          .withVariable("MixedCase", "a mixed-case variable");
        expect(result).to.equal(builder);
        expect(result.variables).to.deep.equal({
          "SIMPLE": "a simple value",
          "MAPPED": "a mapped value",
          "MixedCase": "a mixed-case variable",
        });
      });
      it("fails if variable previously set", () => {
        const result = builder.withVariable("SIMPLE", "a simple value");
        expect(() => result.withVariable("SIMPLE", "a simple override"))
          .to.throw(errors.DuplicateVariable)
          .to.have.property("variable", "SIMPLE");
        expect(result.variables).to.deep.equal({
          "SIMPLE": "a simple value",
        });
      });
    });

    describe("build target", () => {
      it("adds a minimal target", () => {
        const result = builder.withTarget({
          name: "test-target",
        });
        expect(result).to.equal(builder);
        expect(result.targets).to.deep.equal([
          { name: "test-target" },
        ]);
      });
      it("fails on duplicate-named target", () => {
        const result = builder.withTarget({ name: "test-target" });
        expect(() => result.withTarget({ name: "test-target" }))
          .to.throw(errors.DuplicateTarget)
          .to.have.property("target", "test-target");
        expect(result.targets).to.deep.equal([
          { name: "test-target" },
        ]);
      });
    });

    describe("build()", () => {
      it("builds an empty Project", () => {
        const result = builder.build();
        expect(result.parent).to.be.undefined;
        expect(result.path).to.equal("test-project");
        expect(result.variables).to.deep.equal({});
        expect(result.targets).to.deep.equal({} as Record<string, Target>);
      });
      it("builds an empty project with a parent", () => {
        const parent = new Project({ path: "root" });
        const result = builder.build(parent);
        expect(result.parent).to.equal(parent);
        expect(result.path).to.equal("test-project");
        expect(result.variables).to.deep.equal({});
        expect(result.targets).to.deep.equal({} as Record<string, Target>);
      });
      it("builds a populated project", () => {
        const result = builder
          .withVariable("SIMPLE", "a simple value")
          .withTarget(
            new TargetBuilder("test-target")
              .withDescription("a test target")
              .withVariable("MAPPED", "a mapped value")
              .dependsOn("dep-1", "dep-2"),
          )
          .build();
        expect(result.parent).to.be.undefined;
        expect(result.path).to.equal("test-project");
        expect(result.variables).to.deep.equal({
          "SIMPLE": "a simple value",
        });
        expect(result.targets).to.deep.equal({
          "test-target": new Target(result, {
            name: "test-target",
            description: "a test target",
            variables: {
              "MAPPED": "a mapped value",
            },
            dependencies: ["dep-1", "dep-2"],
          }),
        });
      });
      it("builds a populated project with a parent", () => {
        const parent = new Project({ path: "root" });
        const result = builder
          .withVariable("SIMPLE", "a simple value")
          .withTarget(
            new TargetBuilder("test-target")
              .withDescription("a test target")
              .withVariable("MAPPED", "a mapped value")
              .dependsOn("dep-1", "dep-2"),
          )
          .build(parent);
        expect(result.parent).to.equal(parent);
        expect(result.path).to.equal("test-project");
        expect(result.variables).to.deep.equal({
          "SIMPLE": "a simple value",
        });
        expect(result.targets).to.deep.equal({
          "test-target": new Target(result, {
            name: "test-target",
            description: "a test target",
            variables: {
              "MAPPED": "a mapped value",
            },
            dependencies: ["dep-1", "dep-2"],
          }),
        });
      });
    });
  });
});
