/** */

import { describe, it } from "deno_std/testing/bdd.ts";
import { expect } from "expecto/index.ts";

import { Project } from "../../src/projects/impl.ts";
import { InvalidRootProject } from "../../src/errors.ts";
import { TaskPath } from "../../src/tasks/path.ts";

describe("projects/impl", () => {
  describe("Project", () => {
    describe("ctor", () => {
      it("constructs from minimal config", () => {
        const project = new Project({
          path: "my-project",
        });

        expect(project.path).to.equal("my-project");
        expect(project.taskPath).to.deep.equal(new TaskPath("my-project"));
        expect(project.parent).to.be.undefined();
        expect(project.root).to.be.false();
        expect(project.desc).to.equal("");
        expect(project.vars).to.deep.equal({});
        expect(project.tasks).to.deep.equal({});

        expect(project.toConfig()).to.deep.equal({
          path: "my-project",
        });
      });
      it("constructs from full config", () => {
        const project = new Project({
          path: "my-project",
          desc: "my project",
          root: true,
          vars: {
            VAR_1: "project var one",
          },
          tasks: [
            { name: "task-name" },
          ],
        });

        expect(project.path).to.equal("my-project");
        expect(project.taskPath).to.deep.equal(new TaskPath("my-project"));
        expect(project.parent).to.be.undefined();
        expect(project.desc).to.equal("my project");
        expect(project.root).to.be.true();
        expect(project.vars).to.deep.equal({
          VAR_1: "project var one",
        });
        expect(project.tasks).to.deep.equal({
          "task-name": { name: "task-name" },
        });

        expect(project.toConfig()).to.deep.equal({
          path: "my-project",
          desc: "my project",
          root: true,
          vars: {
            VAR_1: "project var one",
          },
          tasks: [
            { name: "task-name" },
          ],
        });
      });
      it("constructs from minimal config + parent", () => {
        const parent = new Project({
          path: "parent-project",
        });
        const project = new Project({
          path: "my-project",
        }, parent);

        expect(project.path).to.equal("my-project");
        expect(project.taskPath).to.deep.equal(new TaskPath("my-project"));
        expect(project.parent).to.equal(parent);
        expect(project.root).to.be.false();
        expect(project.vars).to.deep.equal({});
        expect(project.tasks).to.deep.equal({});

        expect(project.toConfig()).to.deep.equal({
          path: "my-project",
        });
      });
      it("constructs from full config + parent", () => {
        const parent = new Project({
          path: "parent-project",
        });
        const project = new Project({
          path: "parent-project/my-project",
          desc: "my project",
          root: false,
          vars: {
            VAR_1: "project var one",
          },
          tasks: [
            { name: "task-name" },
          ],
        }, parent);

        expect(project.path).to.equal("parent-project/my-project");
        expect(project.taskPath).to.deep.equal(
          new TaskPath("parent-project/my-project"),
        );
        expect(project.parent).to.equal(parent);
        expect(project.desc).to.equal("my project");
        expect(project.root).to.be.false();
        expect(project.vars).to.deep.equal({
          VAR_1: "project var one",
        });
        expect(project.tasks).to.deep.equal({
          "task-name": { name: "task-name" },
        });

        expect(project.toConfig()).to.deep.equal({
          path: "parent-project/my-project",
          desc: "my project",
          vars: {
            VAR_1: "project var one",
          },
          tasks: [
            { name: "task-name" },
          ],
        });
      });
      it("fails if root + parent", () => {
        const parent = new Project({
          path: "root-project",
        });
        const err = expect(() => {
          new Project({
            path: "root-project/my-project",
            root: true,
          }, parent);
        }).to.throw(InvalidRootProject).actual;
        expect(err.project).to.equal("root-project/my-project");
      });
    });

    describe("task()", () => {
      it("throws for any call", async () => {
        const project = new Project({
          path: "my-project",
        });

        const err =
          (await expect(project.task(":build")).to.be.rejectedWith(Error))
            .actual;
        expect(err.message).to.equal("not implemented");
      });
    });
  });
});
