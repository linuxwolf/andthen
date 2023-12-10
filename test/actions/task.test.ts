/** */

import { describe, it } from "deno_std/testing/bdd.ts";
import { expect } from "expecto/index.ts";

import { TaskAction } from "../../src/actions/task.ts";

describe("actions/task", () => {
  describe("TaskAction", () => {
    describe("ctor", () => {
      it("constructs from a minimal config", () => {
        const result = new TaskAction({
          type: "task",
          path: ":task-name",
        });

        expect(result.type).to.equal("task");
        expect(result.path).to.equal(":task-name");
        expect(result.vars).to.deep.equal({});

        expect(result.toConfig()).to.deep.equal({
          type: "task",
          path: ":task-name",
        });
      });
      it("constructs from a full config", () => {
        const result = new TaskAction({
          type: "task",
          path: ":task-name",
          vars: {
            VAR_1: "task action var one",
          },
        });

        expect(result.type).to.equal("task");
        expect(result.path).to.equal(":task-name");
        expect(result.vars).to.deep.equal({
          VAR_1: "task action var one",
        });

        expect(result.toConfig()).to.deep.equal({
          type: "task",
          path: ":task-name",
          vars: {
            VAR_1: "task action var one",
          },
        });
      });
    });
  });
});
