import { describe, expect, it } from "../deps.ts";

import { Task, TaskConfig } from "../../src/core/task.ts";
import { InvalidNameError } from "../../src/util/naming.ts";
import { Variables } from "../../src/core/vars.ts";

describe("core/task", () => {
  describe("Task", () => {
    describe("ctor", () => {
      it("constructs from minimal TaskConfig", () => {
        const cfg = {
          name: "test-task",
        } as TaskConfig;
        const result = new Task(cfg);
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
        const result = new Task(cfg);
        expect(result.name).to.equal("test-task");
        expect(result.description).to.equal("test task description");
        expect(result.dependencies).to.deep.equal(["dep-1", "dep-2"]);
        expect(result.variables).to.deep.equal(new Variables({
          "SIMPLE": "a simple value",
        }));
      });
      it("constructs from a minimal TaskConfig", () => {
        const cfg = {
          name: "test-task",
        };
        const result = new Task(cfg);
        expect(result.name).to.equal("test-task");
        expect(result.description).to.be.empty;
        expect(result.dependencies).to.be.empty;
        expect(result.variables).to.deep.equal(new Variables({}));
      });
      it("fails on invalid name", () => {
        const cfg = {
          name: "invalid name",
        };
        expect(() => new Task(cfg))
          .to.throw(InvalidNameError)
          .to.have.property("value", "invalid name");
      });
    });
  });
});
