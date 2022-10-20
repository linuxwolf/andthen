import { expect, describe, it } from "../deps.ts";

import { Project } from "../../src/core/project.ts";
import { Variables } from "../../src/core/vars.ts";
import { Task } from "../../src/core/task.ts";

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
});
