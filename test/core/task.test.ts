import { describe, expect, it } from "../deps.ts";

import { Project } from "../../src/core/project.ts";
import {
  DuplicateTaskError,
  Task,
  TaskBuilder,
  TaskConfig,
} from "../../src/core/task.ts";
import { InvalidNameError } from "../../src/util/naming.ts";
import { DuplicateVariableError, Variables } from "../../src/core/vars.ts";
import { beforeEach } from "https://deno.land/std@0.159.0/testing/bdd.ts";

describe("core/task", () => {
  const context = new Project({
    path: "test-project",
  });

  describe("Task", () => {
    describe("ctor", () => {
      it("constructs from minimal TaskConfig", () => {
        const cfg = {
          name: "test-task",
        } as TaskConfig;
        const result = new Task(context, cfg);
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
        } as TaskConfig;
        const result = new Task(context, cfg);
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
        const result = new Task(context, cfg);
        expect(result.name).to.equal("test-task");
        expect(result.description).to.be.empty;
        expect(result.dependencies).to.be.empty;
        expect(result.variables).to.deep.equal(new Variables({}));
      });
      it("fails on invalid name", () => {
        const cfg = {
          name: "invalid name",
        };
        expect(() => new Task(context, cfg))
          .to.throw(InvalidNameError)
          .to.have.property("value", "invalid name");
      });
    });
  });

  describe("TaskBuilder", () => {
    let builder: TaskBuilder;

    beforeEach(() => {
      builder = new TaskBuilder("test-task");
    });

    describe("ctor", () => {
      it("constructs an empty TaskBuilder", () => {
        expect(builder.name).to.equal("test-task");
        expect(builder.description).to.be.empty;
        expect(builder.dependencies).to.be.empty;
        expect(builder.variables).to.be.empty;
      });
      it("fails on invalid name", () => {
        expect(() => new TaskBuilder("invalid name")).to.throw(
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

  describe("DuplicateTaskError", () => {
    it("constructs the error", () => {
      const err = new DuplicateTaskError("dup-task");
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal("duplicate task: [ task=dup-task ]");
      expect(err.task).to.equal("dup-task");
      expect(err.name).to.equal("DuplicateTaskError");
    });
  });
});
