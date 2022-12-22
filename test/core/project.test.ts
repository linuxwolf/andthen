import { beforeEach, describe, expect, it } from "../deps.ts";

import {
  Project,
  ProjectBuilder,
  ProjectConfig,
} from "../../src/core/project.ts";
import { Target, TargetBuilder } from "../../src/core/target.ts";
import * as errors from "../../src/errors/mod.ts";

describe("core/project", () => {
  describe("Project", () => {
    describe("ctor", () => {
      it("constructs from a full ProjectConfig but no parent", () => {
        const cfg = {
          filepath: "/usr/local/src/test-project",
          variables: {
            "SIMPLE": "a simple value",
          },
          targets: [
            { name: "test-target" },
          ],
        };
        const result = new Project(cfg);
        expect(result.name).to.equal("test-project");
        expect(result.filepath).to.equal(cfg.filepath);
        expect(result.path).to.equal("//");
        expect(result.parent).to.be.undefined;
        expect(result.root).to.be.true;
        expect(result.default).to.equal("");
        expect(result.variables).to.deep.equal({
          "SIMPLE": "a simple value",
        });

        const targets = {
          "test-target": { name: "test-target" },
        };
        expect(result.targets).to.deep.equal(targets);
      });
      it("constructs with a parent from a full ProjectConfig", () => {
        const parent = new Project({ filepath: "/usr/local/src/root" });
        const cfg = {
          default: "test-target",
          filepath: "/usr/local/src/root/test-project/",
          variables: {
            "SIMPLE": "a simple value",
          },
          targets: [
            { name: "test-target" },
          ],
        };
        const result = new Project(cfg, parent);
        expect(result.parent).to.equal(parent);
        expect(result.filepath).to.equal(cfg.filepath);
        expect(result.name).to.equal("test-project");
        expect(result.root).to.be.false;
        expect(result.path).to.equal("//test-project");
        expect(result.default).to.equal("test-target");
        expect(result.variables).to.deep.equal({
          "SIMPLE": "a simple value",
        });

        const targets = {
          "test-target": { name: "test-target" },
        };
        expect(result.targets).to.deep.equal(targets);
      });
      it("constructs from a minimal ProjectConfig", () => {
        const cfg = {
          filepath: "/usr/local/src/test-project",
        };
        const result = new Project(cfg);
        expect(result.parent).to.be.undefined;
        expect(result.name).to.equal("test-project");
        expect(result.filepath).to.equal(cfg.filepath);
        expect(result.path).to.equal("//");
        expect(result.variables).to.deep.equal({});
        expect(result.targets).to.deep.equal({});
      });
      it("constructs with a parent from a minimal ProjectConfig", () => {
        const parent = new Project({ filepath: "/usr/local/src/root" });
        const cfg = {
          filepath: "/usr/local/src/root/test-project",
        };
        const result = new Project(cfg, parent);
        expect(result.parent).to.equal(parent);
        expect(result.filepath).to.equal(cfg.filepath);
        expect(result.path).to.equal("//test-project");
        expect(result.name).to.equal("test-project");
        expect(result.variables).to.deep.equal({});
        expect(result.targets).to.deep.equal({});
      });
    });

    describe(".targetName()", () => {
      function create(
        targets = ["build", "test", "help"],
        def?: string,
      ): Project {
        const cfg = {
          filepath: "/usr/local/src/project",
          root: true,
          default: def || "",
          variables: {
            "FOO": "foo value",
          },
          targets: targets.map((n) => ({ name: n })),
        } as ProjectConfig;

        return new Project(cfg);
      }

      it("returns the explicit target name", () => {
        const project = create();
        const result = project.targetName("test-target");
        expect(result).to.equal("test-target");
      });
      it("returns the explicitly set default", () => {
        const project = create(undefined, "help");
        const result = project.targetName("default");
        expect(result).to.equal("help");
      });
      it("returns the first target name found", () => {
        const project = create();
        const result = project.targetName("default");
        expect(result).to.equal("build");
      });
      it("returns 'default' if there are no targets and no explicit default set", () => {
        const project = create([]);
        const result = project.targetName("default");
        expect(result).to.equal("default");
      });
    });

    describe(".resolve()", () => {
      const project = new Project({
        filepath: "/usr/local/src/test-project",
        default: "default-target",
        variables: {
          "SIMPLE": "a simple value",
        },
        targets: [
          { name: "test-target" },
          { name: "default-target" },
        ],
      });

      it("resolves a known target", async () => {
        const result = project.resolve("test-target");

        await expect(result).to.eventually.deep.equal(
          new Target(project, { name: "test-target" }),
        );
      });
      it("resolves a default target", async () => {
        const result = project.resolve("default");
        await expect(result).to.eventually.deep.equal(
          new Target(project, { name: "default-target" }),
        );
      });
      it("fails on an unkonwn target", async () => {
        const result = project.resolve("unknown");
        await expect(result).to.be.rejectedWith(errors.TargetNotFound)
          .eventually.with.property("target", "unknown");
      });
    });
  });

  describe("ProjectBuilder", () => {
    let builder: ProjectBuilder;

    beforeEach(() => {
      builder = new ProjectBuilder("/usr/local/src/test-project");
    });

    describe("ctor", () => {
      it("constructs an empty ProjectBuilder", () => {
        expect(builder.filepath).to.equal("/usr/local/src/test-project");
        expect(builder.variables).to.deep.equal({});
        expect(builder.targets).to.deep.equal([]);
      });
      it("constructs a ProjectBuilder from a minimal ProjectConfig", () => {
        const cfg = {
          filepath: "/usr/local/src/test-project",
        };
        const builder = new ProjectBuilder(cfg);
        expect(builder.filepath).to.equal(cfg.filepath);
        expect(builder.root).to.equal(false);
        expect(builder.default).to.equal("default");
        expect(builder.variables).to.deep.equal({});
        expect(builder.targets).to.deep.equal([]);
      });
      it("constructs a ProjectBuilder from a complete ProjectConfig", () => {
        const cfg = {
          filepath: "/usr/local/src/test-project",
          root: false,
          default: "help",
          variables: {
            "FOO": "foo value",
            "BAR": "bar value",
          },
          targets: [
            new TargetBuilder("help"),
            new TargetBuilder("build"),
          ],
        };
        const builder = new ProjectBuilder(cfg);
        expect(builder.filepath).to.equal(cfg.filepath);
        expect(builder.root).to.equal(cfg.root);
        expect(builder.default).to.equal(cfg.default);
        expect(builder.variables).to.deep.equal(cfg.variables);
        expect(builder.targets).to.deep.equal(cfg.targets);
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
        expect(result.filepath).to.equal("/usr/local/src/test-project");
        expect(result.variables).to.deep.equal({});
        expect(result.targets).to.deep.equal({} as Record<string, Target>);
      });
      it("builds an empty project with a parent", () => {
        const parent = new Project({ filepath: "/usr/local/src/root" });
        const result = builder.build(parent);
        expect(result.parent).to.equal(parent);
        expect(result.filepath).to.equal("/usr/local/src/test-project");
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
        expect(result.filepath).to.equal("/usr/local/src/test-project");
        expect(result.variables).to.deep.equal({
          "SIMPLE": "a simple value",
        });
        expect(result.targets).to.deep.equal({
          "test-target": new TargetBuilder({
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
        const parent = new Project({ filepath: "/usr/local/src/root" });
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
        expect(result.filepath).to.equal("/usr/local/src/test-project");
        expect(result.variables).to.deep.equal({
          "SIMPLE": "a simple value",
        });
        expect(result.targets).to.deep.equal({
          "test-target": new TargetBuilder({
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
