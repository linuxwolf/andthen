import { beforeEach, describe, expect, it } from "../deps.ts";

import { Project } from "../../src/core/project.ts";
import {
  Target,
  TargetBuilder,
  TargetConfig,
  TargetPath,
} from "../../src/core/target.ts";
import * as errors from "../../src/errors/mod.ts";

describe("core/target", () => {
  const context = new Project({
    path: "test-project",
  });

  describe("TargetPath", () => {
    describe(".parse()", () => {
      const vectors = [
        {
          name: "parses just a target",
          input: "task",
          expected: {
            target: "task",
            path: "./",
            segments: ["."],
            root: false,
            absolute: false,
          },
        },
        {
          name: "parses a target with a relative path",
          input: "./project:task",
          expected: {
            target: "task",
            path: "./project/",
            segments: [".", "project"],
            root: false,
            absolute: false,
          },
        },
        {
          name: "parses a relative back path to target",
          input: "../:task",
          expected: {
            target: "task",
            path: "../",
            segments: [".."],
            root: false,
            absolute: false,
          },
        },
        {
          name: "parses a deeply relative back path to target",
          input: "../../../another:task",
          expected: {
            target: "task",
            path: "../../../another/",
            segments: ["..", "..", "..", "another"],
            root: false,
            absolute: false,
          },
        },
        {
          name: "parses an absolute path to target",
          input: "/root/path/project:task",
          expected: {
            target: "task",
            path: "/root/path/project/",
            segments: ["root", "path", "project"],
            root: false,
            absolute: true,
          },
        },
        {
          name: "parses a root path to target",
          input: "//root/project:task",
          expected: {
            target: "task",
            path: "/root/project/",
            segments: ["root", "project"],
            root: true,
            absolute: false,
          },
        },
        {
          name: "parses a root target",
          input: "//:task",
          expected: {
            target: "task",
            path: "/",
            segments: [],
            root: true,
            absolute: false,
          },
        },
        {
          name: "parses a meandering path to target",
          input: "./project/../other//./elsewhere/../:task",
          expected: {
            target: "task",
            path: "./other/",
            segments: [".", "other"],
            root: false,
            absolute: false,
          },
        },
        {
          name: "pares a path with implicit target",
          input: "./project",
          expected: {
            target: "default",
            path: "./project/",
            segments: [".", "project"],
            root: false,
            absolute: false,
          },
        },
        {
          name: "parses an absolute path with implicit target",
          input: "/root/project",
          expected: {
            target: "default",
            path: "/root/project/",
            segments: ["root", "project"],
            root: false,
            absolute: true,
          },
        },
        {
          name: "parses a root path with implicit target",
          input: "//root/project",
          expected: {
            target: "default",
            path: "/root/project/",
            segments: ["root", "project"],
            root: true,
            absolute: false,
          },
        },
        {
          name: "parses empty string as implicit target in current directory",
          input: "",
          expected: {
            target: "default",
            path: "./",
            segments: ["."],
            root: false,
            absolute: false,
          },
        },
      ];

      for (const v of vectors) {
        it(v.name, () => {
          const result = TargetPath.parse(v.input);
          console.log(result);
          expect(result).to.deep.equal(v.expected);
          expect(result.toString()).to.equal(
            `${v.expected.path}:${v.expected.target}`,
          );
        });
      }
    });
  });

  describe("Target", () => {
    describe("ctor", () => {
      it("constructs from full TaskConfig", () => {
        const cfg = {
          name: "test-task",
          description: "test task description",
          dependencies: ["dep-1", "dep-2"],
          variables: {
            "SIMPLE": "a simple value",
          },
          action: "echo 'hello, world!'",
          output: "TARGET_RESULT",
        } as TargetConfig;
        const result = new Target(context, cfg);
        expect(result.name).to.equal("test-task");
        expect(result.description).to.equal("test task description");
        expect(result.dependencies).to.deep.equal(["dep-1", "dep-2"]);
        expect(result.variables).to.deep.equal({
          "SIMPLE": "a simple value",
        });
        expect(result.action).to.equal("echo 'hello, world!'");
        expect(result.output).to.equal("TARGET_RESULT");
      });
      it("constructs from a minimal TaskConfig", () => {
        const cfg = {
          name: "test-task",
        };
        const result = new Target(context, cfg);
        expect(result.name).to.equal("test-task");
        expect(result.description).to.be.empty;
        expect(result.dependencies).to.be.empty;
        expect(result.variables).to.deep.equal({});
        expect(result.action).to.be.empty;
        expect(result.output).to.be.empty;
      });
      it("fails on invalid name", () => {
        const cfg = {
          name: "invalid name",
        };
        expect(() => new Target(context, cfg))
          .to.throw(errors.InvalidName)
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
          errors.InvalidName,
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
    describe("build action", () => {
      it("sets an action", () => {
        const result = builder.withAction("echo 'hello, world'");
        expect(result).to.equal(builder);
        expect(result.action).to.equal("echo 'hello, world'");
      });
    });
    describe("build output", () => {
      it("sets an output", () => {
        const result = builder.withOutput("TARGET_RESULT");
        expect(result).to.equal(builder);
        expect(result.output).to.equal("TARGET_RESULT");
      });
    });

    describe("build()", () => {
      it("builds an empty Task", () => {
        const result = builder.build(context);
        expect(result.parent).to.equal(context);
        expect(result.name).to.equal("test-task");
        expect(result.description).to.be.empty;
        expect(result.dependencies).to.be.empty;
        expect(result.variables).to.deep.equal({});
        expect(result.action).to.be.empty;
        expect(result.output).to.be.empty;
      });
      it("builds a full Task", () => {
        const result = builder.withDescription("a test task")
          .dependsOn("dep-1", "dep-2")
          .withVariable("SIMPLE", "a simple value")
          .withAction("echo hello there, ${SIMPLE}")
          .withOutput("TARGET_RESULT")
          .build(context);
        expect(result.parent).to.equal(context);
        expect(result.name).to.equal("test-task");
        expect(result.description).to.equal("a test task");
        expect(result.dependencies).to.deep.equal(["dep-1", "dep-2"]);
        expect(result.variables).to.deep.equal({
          "SIMPLE": "a simple value",
        });
        expect(result.action).to.equal("echo hello there, ${SIMPLE}");
        expect(result.output).to.equal("TARGET_RESULT");
      });
    });
  });
});
