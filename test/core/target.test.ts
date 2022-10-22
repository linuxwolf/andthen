import { beforeEach, describe, expect, it } from "../deps.ts";

import { Project } from "../../src/core/project.ts";
import { DuplicateTargetError, Target, TargetBuilder, TargetConfig, TargetPath } from "../../src/core/target.ts";
import { DuplicateVariableError, Variables } from "../../src/core/vars.ts";
import { InvalidNameError } from "../../src/util/naming.ts";

describe("core/target", () => {
  const context = new Project({
    path: "test-project",
  });

  describe("TargetPath", () => {
    describe("simple cases", () => {
      it("parses a single path task", () => {
        const result = new TargetPath("simple:task");
        expect(result.absolute).to.be.false;
        expect(result.path).to.equal("simple");
        expect(result.segments).to.deep.equal(["simple"]);
        expect(result.task).to.equal("task");
        expect(result.toString()).to.equal("simple:task");
      });
      it("parses a simple path task", () => {
        const result = new TargetPath("simple/path:task");
        expect(result.absolute).to.be.false;
        expect(result.path).to.equal("simple/path");
        expect(result.segments).to.deep.equal(["simple", "path"]);
        expect(result.task).to.equal("task");
        expect(result.toString()).to.equal("simple/path:task");
      });
      it("parses a single implied task", () => {
        const result = new TargetPath("simple");
        expect(result.absolute).to.be.false;
        expect(result.path).to.equal("simple");
        expect(result.segments).to.deep.equal(["simple"]);
        expect(result.task).to.equal("default");
        expect(result.toString()).to.equal("simple:default");
      });
      it("parses a simple implied task", () => {
        const result = new TargetPath("simple/path");
        expect(result.absolute).to.be.false;
        expect(result.path).to.equal("simple/path");
        expect(result.segments).to.deep.equal(["simple", "path"]);
        expect(result.task).to.equal("default");
        expect(result.toString()).to.equal("simple/path:default");
      });
    });

    describe("absolute paths", () => {
      it("parses a single absolute target", () => {
        const result = new TargetPath("/root:task");
        expect(result.absolute).to.be.true;
        expect(result.path).to.equal("/root");
        expect(result.segments).to.deep.equal(["root"]);
        expect(result.task).to.equal("task");
        expect(result.toString()).to.equal("/root:task");
      });
      it("parses a nested absolute target", () => {
        const result = new TargetPath("/root/path/project:task");
        expect(result.absolute).to.be.true;
        expect(result.path).to.equal("/root/path/project");
        expect(result.segments).to.deep.equal(["root", "path", "project"]);
        expect(result.task).to.equal("task");
        expect(result.toString()).to.equal("/root/path/project:task");
      });
      it("parses single absolute implied task", () => {
        const result = new TargetPath("/root");
        expect(result.absolute).to.be.true;
        expect(result.path).to.equal("/root");
        expect(result.segments).to.deep.equal(["root"]);
        expect(result.task).to.equal("default");
        expect(result.toString()).to.equal("/root:default");
      });
      it("parses a nested absolute implied target", () => {
        const result = new TargetPath("/root/path/project");
        expect(result.absolute).to.be.true;
        expect(result.path).to.equal("/root/path/project");
        expect(result.segments).to.deep.equal(["root", "path", "project"]);
        expect(result.task).to.equal("default");
        expect(result.toString()).to.equal("/root/path/project:default");
      });
    });

    describe("simple relative", () => {
      it("parses a relative-parent path task", () => {
        const result = new TargetPath("../simple:task");
        expect(result.absolute).to.be.false;
        expect(result.path).to.equal("../simple");
        expect(result.segments).to.deep.equal(["..", "simple"]);
        expect(result.task).to.equal("task");
        expect(result.toString()).to.equal("../simple:task");
      });

      it("parses a relative-self path task", () => {
        const result = new TargetPath("./simple:task");
        expect(result.absolute).to.be.false;
        expect(result.path).to.equal("simple");
        expect(result.segments).to.deep.equal(["simple"]);
        expect(result.task).to.equal("task");
        expect(result.toString()).to.equal("simple:task");
      });
    });

    describe("complex relative", () => {
      it("collapses intermediate relative paths", () => {
        const result = new TargetPath("complex/./path/../project:task");
        expect(result.absolute).to.be.false;
        expect(result.path).to.equal("complex/project");
        expect(result.segments).to.deep.equal(["complex", "project"]);
        expect(result.task).to.equal("task");
        expect(result.toString()).to.equal("complex/project:task");
      });
      it("keeps deep parent-relative paths", () => {
        const result = new TargetPath("../../complex/path:task");
        expect(result.absolute).to.be.false;
        expect(result.path).to.equal("../../complex/path");
        expect(result.segments).to.deep.equal(["..", "..", "complex", "path"]);
        expect(result.task).to.equal("task");
        expect(result.toString()).to.equal("../../complex/path:task");
      });
      it("strips intermediate self-relative between parent-relatives", () => {
        const result = new TargetPath(".././../complex/path:task");
        expect(result.absolute).to.be.false;
        expect(result.path).to.equal("../../complex/path");
        expect(result.segments).to.deep.equal(["..", "..", "complex", "path"]);
        expect(result.task).to.equal("task");
        expect(result.toString()).to.equal("../../complex/path:task");
      });
    });

    describe("with base", () => {
      it("parses absolute base with simple target", () => {
        const result = new TargetPath("simple:task", "/path/to/root");
        expect(result.absolute).to.be.true;
        expect(result.path).to.equal("/path/to/root/simple");
        expect(result.segments).to.deep.equal(["path", "to", "root", "simple"]);
        expect(result.task).to.equal("task");
        expect(result.toString()).to.equal("/path/to/root/simple:task");
      });
      it("parses absolute base with nested target", () => {
        const result = new TargetPath("simple/project:task", "/path/to/root");
        expect(result.absolute).to.be.true;
        expect(result.path).to.equal("/path/to/root/simple/project");
        expect(result.segments).to.deep.equal([
          "path",
          "to",
          "root",
          "simple",
          "project",
        ]);
        expect(result.task).to.equal("task");
        expect(result.toString()).to.equal("/path/to/root/simple/project:task");
      });
      it("parses absolute base with parent-relative target", () => {
        const result = new TargetPath("../project:task", "/path/to/root");
        expect(result.absolute).to.be.true;
        expect(result.path).to.equal("/path/to/project");
        expect(result.segments).to.deep.equal(["path", "to", "project"]);
        expect(result.task).to.equal("task");
        expect(result.toString()).to.equal("/path/to/project:task");
      });
      it("parses absolute base with self-relative target", () => {
        const result = new TargetPath("./project:task", "/path/to/root");
        expect(result.absolute).to.be.true;
        expect(result.path).to.equal("/path/to/root/project");
        expect(result.segments).to.deep.equal([
          "path",
          "to",
          "root",
          "project",
        ]);
        expect(result.task).to.equal("task");
        expect(result.toString()).to.equal("/path/to/root/project:task");
      });

      it("parses relative base with simple target", () => {
        const result = new TargetPath("simple:task", "relative/base");
        expect(result.absolute).to.be.false;
        expect(result.path).to.equal("relative/base/simple");
        expect(result.segments).to.deep.equal(["relative", "base", "simple"]);
        expect(result.task).to.equal("task");
        expect(result.toString()).to.equal("relative/base/simple:task");
      });
      it("parses relative base with nested target", () => {
        const result = new TargetPath("simple/project:task", "relative/base");
        expect(result.absolute).to.be.false;
        expect(result.path).to.equal("relative/base/simple/project");
        expect(result.segments).to.deep.equal([
          "relative",
          "base",
          "simple",
          "project",
        ]);
        expect(result.task).to.equal("task");
        expect(result.toString()).to.equal("relative/base/simple/project:task");
      });
      it("parses relative base with parent-relative target", () => {
        const result = new TargetPath("../project:task", "relative/base");
        expect(result.absolute).to.be.false;
        expect(result.path).to.equal("relative/project");
        expect(result.segments).to.deep.equal(["relative", "project"]);
        expect(result.task).to.equal("task");
        expect(result.toString()).to.equal("relative/project:task");
      });
      it("parses relative base with self-relative target", () => {
        const result = new TargetPath("./project:task", "relative/base");
        expect(result.absolute).to.be.false;
        expect(result.path).to.equal("relative/base/project");
        expect(result.segments).to.deep.equal(["relative", "base", "project"]);
        expect(result.task).to.equal("task");
        expect(result.toString()).to.equal("relative/base/project:task");
      });
    });

    it("parses an empty string", () => {
      const result = new TargetPath("");
      expect(result.absolute).to.be.false;
      expect(result.path).to.equal("");
      expect(result.segments).to.deep.equal([]);
      expect(result.task).to.equal("default");
      expect(result.toString()).to.equal(":default");
    });
    it("parses just  '/'", () => {
      const result = new TargetPath("/");
      expect(result.absolute).to.be.true;
      expect(result.path).to.equal("/");
      expect(result.segments).to.deep.equal([]);
      expect(result.task).to.equal("default");
      expect(result.toString()).to.equal("/:default");
    });
  });

  describe("Target", () => {
    describe("ctor", () => {
      it("constructs from minimal TaskConfig", () => {
        const cfg = {
          name: "test-task",
        } as TargetConfig;
        const result = new Target(context, cfg);
        expect(result.name).to.equal("test-task");
        expect(result.description).to.be.empty;
        expect(result.dependencies).to.be.empty;
      });
      it("constructs from full TaskConfig", () => {
        const cfg = {
          name: "test-task",
          description: "test task description",
          dependencies: ["dep-1", "dep-2"],
          variables: {
            "SIMPLE": "a simple value",
          },
        } as TargetConfig;
        const result = new Target(context, cfg);
        expect(result.name).to.equal("test-task");
        expect(result.description).to.equal("test task description");
        expect(result.dependencies).to.deep.equal(["dep-1", "dep-2"]);
        expect(result.variables).to.deep.equal(
          new Variables({
            "SIMPLE": "a simple value",
          }),
        );
      });
      it("constructs from a minimal TaskConfig", () => {
        const cfg = {
          name: "test-task",
        };
        const result = new Target(context, cfg);
        expect(result.name).to.equal("test-task");
        expect(result.description).to.be.empty;
        expect(result.dependencies).to.be.empty;
        expect(result.variables).to.deep.equal(new Variables({}));
      });
      it("fails on invalid name", () => {
        const cfg = {
          name: "invalid name",
        };
        expect(() => new Target(context, cfg))
          .to.throw(InvalidNameError)
          .to.have.property("value", "invalid name");
      });
    });
  });

  describe("TaskBuilder", () => {
    let builder: TargetBuilder;

    beforeEach(() => {
      builder = new TargetBuilder("test-task");
    });

    describe("ctor", () => {
      it("constructs an empty TaskBuilder", () => {
        expect(builder.name).to.equal("test-task");
        expect(builder.description).to.be.empty;
        expect(builder.dependencies).to.be.empty;
        expect(builder.variables).to.be.empty;
      });
      it("fails on invalid name", () => {
        expect(() => new TargetBuilder("invalid name")).to.throw(
          InvalidNameError,
        );
      });
    });

    describe("build description", () => {
      it("adds a description", () => {
        const result = builder.withDescription("a test task");
        expect(result).to.equal(builder);
        expect(result.description).to.equal("a test task");
      });
    });
    describe("build dependencies", () => {
      it("adds a dependency", () => {
        const result = builder.dependsOn("dep-1");
        expect(result).to.equal(builder);
        expect(result.dependencies).to.deep.equal(["dep-1"]);
      });
      it("adds multiple dependencies at once", () => {
        const result = builder.dependsOn("dep-1", "dep-2", "dep-3");
        expect(result).to.equal(builder);
        expect(result.dependencies).to.deep.equal(["dep-1", "dep-2", "dep-3"]);
      });
      it("adds multiple dependencies individually", () => {
        const result = builder.dependsOn("dep-1")
          .dependsOn("dep-2")
          .dependsOn("dep-3");
        expect(result).to.equal(builder);
        expect(result.dependencies).to.deep.equal(["dep-1", "dep-2", "dep-3"]);
      });
      it("dedups depdendencies", () => {
        const result = builder.dependsOn("dep-1", "dep-2")
          .dependsOn("dep-2", "dep-3")
          .dependsOn("dep-1", "dep-4");
        expect(result).to.equal(builder);
        expect(result.dependencies).to.deep.equal([
          "dep-1",
          "dep-2",
          "dep-3",
          "dep-4",
        ]);
      });
    });
    describe("buld variables", () => {
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
          .to.throw(DuplicateVariableError)
          .to.have.property("variable", "SIMPLE");
        expect(result.variables).to.deep.equal({
          "SIMPLE": "a simple value",
        });
      });
    });

    describe("build()", () => {
      it("builds an empty Task", () => {
        const result = builder.build(context);
        expect(result.parent).to.equal(context);
        expect(result.name).to.equal("test-task");
        expect(result.description).to.be.empty;
        expect(result.dependencies).to.be.empty;
        expect(result.variables).to.deep.equal(new Variables({}));
      });
      it("builds a full Task", () => {
        const result = builder.withDescription("a test task")
          .dependsOn("dep-1", "dep-2")
          .withVariable("SIMPLE", "a simple value")
          .build(context);
        expect(result.parent).to.equal(context);
        expect(result.name).to.equal("test-task");
        expect(result.description).to.equal("a test task");
        expect(result.dependencies).to.deep.equal(["dep-1", "dep-2"]);
        expect(result.variables).to.deep.equal(
          new Variables({
            "SIMPLE": "a simple value",
          }),
        );
      });
    });
  });

  describe("DuplicateTargetError", () => {
    it("constructs the error", () => {
      const err = new DuplicateTargetError("dup-task");
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal("duplicate task: [ task=dup-task ]");
      expect(err.task).to.equal("dup-task");
      expect(err.name).to.equal("DuplicateTargetError");
    });
  });

});
