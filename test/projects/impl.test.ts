/** */

import { describe, it } from "deno_std/testing/bdd.ts";
import { expect } from "expecto/index.ts";

import { Project } from "../../src/projects/impl.ts";

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
        expect(project.default).to.equal("default");
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
          default: "build-it",
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
        expect(project.default).to.equal("build-it");
        expect(project.vars).to.deep.equal({
          VAR_1: "project var one",
        });
        expect(project.tasks).to.deep.equal({
          "task-name": { name: "task-name" },
        });

        expect(project.toConfig()).to.deep.equal({
          name: "my-project",
          root: true,
          default: "build-it",
          vars: {
            VAR_1: "project var one",
          },
          tasks: [
            { name: "task-name" },
          ],
        });
      });
    });
  });
});
