/** */

import { describe, it } from "deno_std/testing/bdd.ts";
import { expect } from "expecto/index.ts";

import { Project } from "../../src/projects/impl.ts";
import { InvalidRootProject } from "../../src/errors.ts";

describe("projects/impl", () => {
  describe("Project", () => {
    describe("ctor", () => {
      it("constructs from minimal config", () => {
        const project = new Project({
          name: "my-project",
        });

        expect(project.name).to.equal("my-project");
        expect(project.parent).to.be.undefined();
        expect(project.root).to.be.false();
        expect(project.vars).to.deep.equal({});
        expect(project.tasks).to.deep.equal({});

        expect(project.toConfig()).to.deep.equal({
          name: "my-project",
        });
      });
      it("constructs from full config", () => {
        const project = new Project({
          name: "my-project",
          root: true,
          vars: {
            VAR_1: "project var one",
          },
          tasks: [
            { name: "task-name" },
          ],
        });

        expect(project.name).to.equal("my-project");
        expect(project.parent).to.be.undefined();
        expect(project.root).to.be.true();
        expect(project.vars).to.deep.equal({
          VAR_1: "project var one",
        });
        expect(project.tasks).to.deep.equal({
          "task-name": { name: "task-name" },
        });

        expect(project.toConfig()).to.deep.equal({
          name: "my-project",
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
          name: "parent-project",
        });
        const project = new Project({
          name: "my-project",
        }, parent);

        expect(project.name).to.equal("my-project");
        expect(project.parent).to.equal(parent);
        expect(project.root).to.be.false();
        expect(project.vars).to.deep.equal({});
        expect(project.tasks).to.deep.equal({});

        expect(project.toConfig()).to.deep.equal({
          name: "my-project",
        });
      });
      it("constructs from full config + parent", () => {
        const parent = new Project({
          name: "parent-project",
        });
        const project = new Project({
          name: "my-project",
          root: false,
          vars: {
            VAR_1: "project var one",
          },
          tasks: [
            { name: "task-name" },
          ],
        }, parent);

        expect(project.name).to.equal("my-project");
        expect(project.parent).to.equal(parent);
        expect(project.root).to.be.false();
        expect(project.vars).to.deep.equal({
          VAR_1: "project var one",
        });
        expect(project.tasks).to.deep.equal({
          "task-name": { name: "task-name" },
        });

        expect(project.toConfig()).to.deep.equal({
          name: "my-project",
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
          name: "root-project",
        });
        const err = expect(() => {
          new Project({
            name: "my-project",
            root: true,
          }, parent);
        }).to.throw(InvalidRootProject).actual;
        expect(err.project).to.equal("root-project/my-project");
      });
    });

    describe("path()", () => {
      it("returns a single-level", () => {
        const project = new Project({
          name: "my-project",
        });

        expect(project.path()).to.equal("my-project");
      });
      it("returns for a hierarchy", () => {
        const parent = (() => {
          const root = new Project({
            name: "project-root",
            root: true,
          });
          const sub = new Project({
            name: "sub-project",
          }, root);

          return sub;
        })();
        const project = new Project({
          name: "my-project",
        }, parent);

        expect(project.path()).to.equal("project-root/sub-project/my-project");
      });
    });
  });
});
