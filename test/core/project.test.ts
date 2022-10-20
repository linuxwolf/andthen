import { expect, describe, it } from "../deps.ts";

import { Project, ProjectBuilder } from "../../src/core/project.ts";
import { Variables } from "../../src/core/vars.ts";
import { Task } from "../../src/core/task.ts";
import { beforeEach } from "https://deno.land/std@0.159.0/testing/bdd.ts";

describe("core/project", () => {
  describe("Project", () => {
    describe("ctor", () => {
      it("constructs from a full ProjectConfig", () => {
        const cfg = {
          path: "test-project",
          variables: {
            "SIMPLE": "a simple value",
          },
          tasks: {
            "test-task": { name: "test-task" },
          },
        };
        const result = new Project(cfg);
        expect(result.parent).to.be.undefined;
        expect(result.path).to.equal(cfg.path);
        expect(result.variables).to.deep.equal(new Variables({
          "SIMPLE": "a simple value",
        }));

        const tasks = {
          "test-task": new Task(result, { name: "test-task" }),
        }
        expect(result.tasks).to.deep.equal(tasks);
      });
      it("constructs with a parent from a full ProjectConfig", () => {
        const parent = new Project({ path: "root" });
        const cfg = {
          path: "test-project",
          variables: {
            "SIMPLE": "a simple value",
          },
          tasks: {
            "test-task": { name: "test-task" },
          },
        };
        const result = new Project(cfg, parent);
        expect(result.parent).to.equal(parent);
        expect(result.path).to.equal(cfg.path);
        expect(result.variables).to.deep.equal(new Variables({
          "SIMPLE": "a simple value",
        }));

        const tasks = {
          "test-task": new Task(result, { name: "test-task" }),
        }
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
        expect(builder.tasks).to.deep.equal({});
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
        const result = builder.withVariable("SIMPLE", "a simple value").
                              withVariable("MAPPED", "a mapped value").
                              withVariable("MixedCase", "a mixed-case variable");
        expect(result).to.equal(builder);
        expect(result.variables).to.deep.equal({
          "SIMPLE": "a simple value",
          "MAPPED": "a mapped value",
          "MixedCase": "a mixed-case variable",
        });
      });
      it("overrides previously set variables", () => {
        const result = builder.withVariable("SIMPLE", "a simple value").
                               withVariable("SIMPLE", "a simple override").
                               withVariable("SIMPLE", "another simple override of a value");
        expect(result).to.equal(builder);
        expect(result.variables).to.deep.equal({
          "SIMPLE": "another simple override of a value",
        });
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
    });
  });
});
