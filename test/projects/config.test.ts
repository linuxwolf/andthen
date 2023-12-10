/** */

import { describe, it } from "deno_std/testing/bdd.ts";
import { expect } from "expecto/index.ts";

import { z } from "zod";
import { asConfig } from "../../src/projects/config.ts";

describe("projects/config", () => {
  describe("asConfig()", () => {
    describe("success", () => {
      it("returns from minimal", () => {
        const result = asConfig("my-project", {});

        expect(result.name).to.equal("my-project");
        expect(result.desc).to.be.undefined();
        expect(result.root).to.be.undefined();
        expect(result.vars).to.be.undefined();
        expect(result.tasks).to.be.undefined();
      });
      it("returns from full", () => {
        const result = asConfig("my-project", {
          desc: "my project",
          root: true,
          vars: {
            VAR_1: "project variable one",
            VAR_2: "project variable two",
          },
          tasks: {
            "task-name": {
              desc: "some task",
              internal: true,
              deps: [":dep-task-1"],
              vars: {
                VAR_1: "task variable one",
                VAR_3: "task variable three",
              },
              steps: [
                "do simple cmd",
              ],
            },
          },
        });

        expect(result.name).to.equal("my-project");
        expect(result.desc).to.equal("my project");
        expect(result.root).to.be.true();
        expect(result.vars).to.deep.equal({
          VAR_1: "project variable one",
          VAR_2: "project variable two",
        });
        expect(result.tasks).to.deep.equal([
          {
            name: "task-name",
            desc: "some task",
            internal: true,
            deps: [":dep-task-1"],
            vars: {
              VAR_1: "task variable one",
              VAR_3: "task variable three",
            },
            steps: [
              { type: "shell", cmd: "do simple cmd" },
            ],
          },
        ]);
      });
    });

    describe("errors", () => {
      it("throws on simple field error", () => {
        expect(() => {
          asConfig("my-project", {
            root: "42",
            vars: ["some", "bad", "vars"],
          });
        }).to.throw(z.ZodError);
      });
      it("throws on task error", () => {
        expect(() => {
          asConfig("my-project", {
            tasks: {
              "task-name": {
                internal: "potato",
              },
            },
          });
        }).to.throw(z.ZodError);
      });
    });
  });
});
