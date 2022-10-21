import { beforeEach, describe, expect, it } from "../deps.ts";

import { Project, ProjectBuilder } from "../../src/core/project.ts";
import { DuplicateVariableError, Variables } from "../../src/core/vars.ts";
import { DuplicateTaskError, Task, TaskBuilder } from "../../src/core/task.ts";
describe("core/project", () => {
  describe("Project", () => {
    describe("ctor", () => {
      it("constructs from a full ProjectConfig", () => {
        const cfg = {
          path: "test-project",
          variables: {
            "SIMPLE": "a simple value",
          },
          tasks: [
            { name: "test-task" },
          ],
        };
        const result = new Project(cfg);
        expect(result.parent).to.be.undefined;
        expect(result.path).to.equal(cfg.path);
        expect(result.variables).to.deep.equal(
          new Variables({
            "SIMPLE": "a simple value",
          }),
        );

        const tasks = {
          "test-task": new Task(result, { name: "test-task" }),
        };
        expect(result.tasks).to.deep.equal(tasks);
      });
      it("constructs with a parent from a full ProjectConfig", () => {
        const parent = new Project({ path: "root" });
        const cfg = {
          path: "test-project",
          variables: {
            "SIMPLE": "a simple value",
          },
          tasks: [
            { name: "test-task" },
          ],
        };
        const result = new Project(cfg, parent);
        expect(result.parent).to.equal(parent);
        expect(result.path).to.equal(cfg.path);
        expect(result.variables).to.deep.equal(
          new Variables({
            "SIMPLE": "a simple value",
          }),
        );

        const tasks = {
          "test-task": new Task(result, { name: "test-task" }),
        };
        expect(result.tasks).to.deep.equal(tasks);
      });
      it("constructs from a minimal ProjectConfig", () => {
        const cfg = {
          path: "test-project",
        };
        const result = new Project(cfg);
        expect(result.parent).to.be.undefined;
        expect(result.path).to.equal(cfg.path);
        expect(result.variables).to.deep.equal(new Variables({}));
        expect(result.tasks).to.deep.equal({});
      });
      it("constructs with a parent from a minimal ProjectConfi", () => {
        const parent = new Project({ path: "root" });
        const cfg = {
          path: "test-project",
        };
        const result = new Project(cfg, parent);
        expect(result.parent).to.equal(parent);
        expect(result.path).to.equal(cfg.path);
        expect(result.variables).to.deep.equal(new Variables({}));
        expect(result.tasks).to.deep.equal({});
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
        expect(builder.tasks).to.deep.equal([]);
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
          .to.throw(DuplicateVariableError)
          .to.have.property("variable", "SIMPLE");
        expect(result.variables).to.deep.equal({
          "SIMPLE": "a simple value",
        });
      });
    });

    describe("build task", () => {
      it("adds a minimal task", () => {
        const result = builder.withTask({
          name: "test-task",
        });
        expect(result).to.equal(builder);
        expect(result.tasks).to.deep.equal([
          { name: "test-task" },
        ]);
      });
      it("fails on duplicate-named task", () => {
        const result = builder.withTask({ name: "test-task" });
        expect(() => result.withTask({ name: "test-task" }))
          .to.throw(DuplicateTaskError)
          .to.have.property("task", "test-task");
        expect(result.tasks).to.deep.equal([
          { name: "test-task" },
        ]);
      });
    });

    describe("build()", () => {
      it("builds an empty Project", () => {
        const result = builder.build();
        expect(result.parent).to.be.undefined;
        expect(result.path).to.equal("test-project");
        expect(result.variables).to.deep.equal(new Variables({}));
        expect(result.tasks).to.deep.equal({} as Record<string, Task>);
      });
      it("builds an empty project with a parent", () => {
        const parent = new Project({ path: "root" });
        const result = builder.build(parent);
        expect(result.parent).to.equal(parent);
        expect(result.path).to.equal("test-project");
        expect(result.variables).to.deep.equal(new Variables({}));
        expect(result.tasks).to.deep.equal({} as Record<string, Task>);
      });
      it("builds a populated project", () => {
        const result = builder
          .withVariable("SIMPLE", "a simple value")
          .withTask(
            new TaskBuilder("test-task")
              .withDescription("a test task")
              .withVariable("MAPPED", "a mapped value")
              .dependsOn("dep-1", "dep-2"),
          )
          .build();
        expect(result.parent).to.be.undefined;
        expect(result.path).to.equal("test-project");
        expect(result.variables).to.deep.equal(
          new Variables({
            "SIMPLE": "a simple value",
          }),
        );
        expect(result.tasks).to.deep.equal({
          "test-task": new Task(result, {
            name: "test-task",
            description: "a test task",
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
          .withTask(
            new TaskBuilder("test-task")
              .withDescription("a test task")
              .withVariable("MAPPED", "a mapped value")
              .dependsOn("dep-1", "dep-2"),
          )
          .build(parent);
        expect(result.parent).to.equal(parent);
        expect(result.path).to.equal("test-project");
        expect(result.variables).to.deep.equal(
          new Variables({
            "SIMPLE": "a simple value",
          }),
        );
        expect(result.tasks).to.deep.equal({
          "test-task": new Task(result, {
            name: "test-task",
            description: "a test task",
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
