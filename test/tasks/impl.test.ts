/** */

import { describe, it } from "deno_std/testing/bdd.ts";
import { expect } from "expecto/index.ts";

import { Task } from "../../src/tasks/impl.ts";

describe("tasks/impl", () => {
  describe("Task", () => {
    describe("ctor", () => {
      it("constructs from minimal config", () => {
        const task = new Task({
          name: "task-name",
        });
        expect(task.name).to.equal("task-name");
        expect(task.parent).to.be.undefined();
        expect(task.internal).to.be.false();
        expect(task.desc).to.equal("");
        expect(task.vars).to.deep.equal({});
        expect(task.deps).to.deep.equal([]);
        expect(task.steps).to.deep.equal([]);

        expect(task.toConfig()).to.deep.equal({
          name: "task-name",
        });
      });
      it("constructs from a full config", () => {
        const parent = {};
        const task = new Task({
          parent,
          name: "task-name",
          desc: "a dummy task",
          internal: true,
          vars: {
            VAR_1: "task var one",
          },
          deps: [
            { name: "dep-task-1" },
          ],
          steps: [
            { type: "shell" },
          ],
        });
        expect(task.name).to.equal("task-name");
        expect(task.parent).to.equal(parent);
        expect(task.internal).to.be.true();
        expect(task.desc).to.equal("a dummy task");
        expect(task.vars).to.deep.equal({
          VAR_1: "task var one",
        });
        expect(task.deps).to.deep.equal([
          { name: "dep-task-1" },
        ]);
        expect(task.steps).to.deep.equal([
          { type: "shell" },
        ]);

        expect(task.toConfig()).to.deep.equal({
          name: "task-name",
          parent,
          desc: "a dummy task",
          internal: true,
          vars: {
            VAR_1: "task var one",
          },
          deps: [
            { name: "dep-task-1" },
          ],
          steps: [
            { type: "shell" },
          ],
        });
      });
      it("constructs from a min config + direct parent", () => {
        const parent = {};
        const task = new Task({
          name: "task-name",
        }, parent);
        expect(task.name).to.equal("task-name");
        expect(task.parent).to.equal(parent);
        expect(task.internal).to.be.false();
        expect(task.desc).to.equal("");
        expect(task.vars).to.deep.equal({});
        expect(task.deps).to.deep.equal([]);
        expect(task.steps).to.deep.equal([]);

        expect(task.toConfig()).to.deep.equal({
          name: "task-name",
          parent,
        });
      });
      it("constructs from a full config + direct parent", () => {
        const cfgParent = {};
        const directParent = {};
        const task = new Task({
          name: "task-name",
          parent: cfgParent,
          desc: "a dummy task",
          internal: true,
          vars: {
            VAR_1: "task var one",
          },
          deps: [
            { name: "dep-task-1" },
          ],
          steps: [
            { type: "shell" },
          ],
        }, directParent);
        expect(task.name).to.equal("task-name");
        expect(task.parent).to.equal(directParent);
        expect(task.internal).to.be.true();
        expect(task.desc).to.equal("a dummy task");
        expect(task.vars).to.deep.equal({
          VAR_1: "task var one",
        });
        expect(task.deps).to.deep.equal([
          { name: "dep-task-1" },
        ]);
        expect(task.steps).to.deep.equal([
          { type: "shell" },
        ]);

        expect(task.toConfig()).to.deep.equal({
          name: "task-name",
          parent: directParent,
          desc: "a dummy task",
          internal: true,
          vars: {
            VAR_1: "task var one",
          },
          deps: [
            { name: "dep-task-1" },
          ],
          steps: [
            { type: "shell" },
          ],
        });
      });
    });
  });
});
