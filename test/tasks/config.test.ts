/** */

import { describe, it } from "deno_std/testing/bdd.ts";
import { expect } from "expecto/index.ts";

import { z } from "zod";
import { asConfig } from "../../src/tasks/config.ts";

describe("tasks/config", () => {
  describe("asConfig()", () => {
    describe("successes", () => {
      it("returns from minimal", () => {
        const config = asConfig("task-name", {});
        expect(config).to.deep.equal({
          name: "task-name",
        });
      });
      it("returns from all simple", () => {
        const config = asConfig("task-name", {
          desc: "a test task",
          internal: true,
          vars: {
            VAR_1: "task variable one",
          },
          deps: [
            ":task-dep-1",
          ],
        });
        expect(config).to.deep.equal({
          name: "task-name",
          desc: "a test task",
          internal: true,
          vars: {
            VAR_1: "task variable one",
          },
          deps: [
            ":task-dep-1",
          ],
        });
      });
      it("returns from just steps", () => {
        const config = asConfig("task-name", {
          steps: [
            "do simple cmd",
            { cmd: "do shell command" },
            { path: ":task-cmd" },
          ],
        });
        expect(config).to.deep.equal({
          name: "task-name",
          steps: [
            { cmd: "do simple cmd" },
            { cmd: "do shell command" },
            { path: ":task-cmd" },
          ],
        });
      });
      it("returns from full", () => {
        const config = asConfig("task-name", {
          desc: "a test task",
          internal: true,
          vars: {
            VAR_1: "task variable one",
          },
          deps: [
            ":task-dep-1",
          ],
          steps: [
            "do simple cmd",
            { cmd: "do shell command" },
            { path: ":task-cmd" },
          ],
        });
        expect(config).to.deep.equal({
          name: "task-name",
          desc: "a test task",
          internal: true,
          vars: {
            VAR_1: "task variable one",
          },
          deps: [
            ":task-dep-1",
          ],
          steps: [
            { cmd: "do simple cmd" },
            { cmd: "do shell command" },
            { path: ":task-cmd" },
          ],
        });
      });
    });

    describe("errors", () => {
      it("throws on simple invalid schema", () => {
        expect(() => {
          asConfig("task-name", {
            internal: "stuff",
            vars: ["some", "bad", "vars"],
          });
        }).to.throw(z.ZodError);
      });
      it("throws on steps invalid schema", () => {
        expect(() => {
          asConfig("task-name", {
            steps: [
              { stuff: "things" },
            ],
          });
        }).to.throw(z.ZodError);
      });
    });
  });
});
