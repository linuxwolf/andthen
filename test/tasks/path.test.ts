/** */

import { describe, it } from "deno_std/testing/bdd.ts";
import { expect } from "expecto/index.ts";

import { InvalidTaskPath } from "../../src/errors.ts";
import { TaskPath } from "../../src/tasks/path.ts";

describe("tasks/path", () => {
  describe("TaskPath", () => {
    describe("ctor", () => {
      describe("relative", () => {
        it("parses a simple relative path", () => {
          const result = new TaskPath("path/to/project:task-name");

          expect(result.isAbsolute).to.be.false();
          expect(result.isRoot).to.be.false();
          expect(result.isRelative).to.be.true();
          expect(result.task).to.equal("task-name");
          expect(result.prefix).to.equal("");
          expect(result.segments).to.deep.equal([
            "path",
            "to",
            "project",
          ]);
          expect(result.path).to.equal("path/to/project");

          expect(result.toString()).to.equal("path/to/project:task-name");
        });
        it("parses a relative with no task name", () => {
          const result = new TaskPath("path/to/project");

          expect(result.isAbsolute).to.be.false();
          expect(result.isRoot).to.be.false();
          expect(result.isRelative).to.be.true();
          expect(result.task).to.equal("");
          expect(result.prefix).to.equal("");
          expect(result.segments).to.deep.equal([
            "path",
            "to",
            "project",
          ]);
          expect(result.path).to.equal("path/to/project");

          expect(result.toString()).to.equal("path/to/project");
        });
        it("parses with leading '.' segment", () => {
          const result = new TaskPath("./project:task-name");

          expect(result.isAbsolute).to.be.false();
          expect(result.isRoot).to.be.false();
          expect(result.isRelative).to.be.true();
          expect(result.task).to.equal("task-name");
          expect(result.prefix).to.equal("");
          expect(result.segments).to.deep.equal([
            "project",
          ]);
          expect(result.path).to.equal("project");

          expect(result.toString()).to.equal("project:task-name");
        });
        it("parses with leading '..' segments", () => {
          const result = new TaskPath("../../other/project:task-name");

          expect(result.isAbsolute).to.be.false();
          expect(result.isRoot).to.be.false();
          expect(result.isRelative).to.be.true();
          expect(result.task).to.equal("task-name");
          expect(result.prefix).to.equal("");
          expect(result.segments).to.deep.equal([
            "..",
            "..",
            "other",
            "project",
          ]);
          expect(result.path).to.equal("../../other/project");

          expect(result.toString()).to.equal("../../other/project:task-name");
        });
        it("parses with in-range '.' and '..'", () => {
          const result = new TaskPath("some/base/../other/./project:task-name");

          expect(result.isAbsolute).to.be.false();
          expect(result.isRoot).to.be.false();
          expect(result.isRelative).to.be.true();
          expect(result.task).to.equal("task-name");
          expect(result.prefix).to.equal("");
          expect(result.segments).to.deep.equal([
            "some",
            "other",
            "project",
          ]);
          expect(result.path).to.equal("some/other/project");

          expect(result.toString()).to.equal("some/other/project:task-name");
        });
        it("parses just a task name", () => {
          const result = new TaskPath(":task-name");

          expect(result.isAbsolute).to.be.false();
          expect(result.isRoot).to.be.false();
          expect(result.isRelative).to.be.true();
          expect(result.task).to.equal("task-name");
          expect(result.prefix).to.equal("");
          expect(result.segments).to.deep.equal([]);
          expect(result.path).to.equal("./");

          expect(result.toString()).to.equal("./:task-name");
        });
      });

      describe("absolute", () => {
        it("parses a simple absolute path", () => {
          const result = new TaskPath("/abs/project:task-name");

          expect(result.isAbsolute).to.be.true();
          expect(result.isRoot).to.be.false();
          expect(result.isRelative).to.be.false();
          expect(result.task).to.equal("task-name");
          expect(result.prefix).to.equal("/");
          expect(result.segments).to.deep.equal([
            "abs",
            "project",
          ]);
          expect(result.path).to.equal("/abs/project");

          expect(result.toString()).to.equal("/abs/project:task-name");
        });
        it("parses an absolute with no task name", () => {
          const result = new TaskPath("/abs/project");

          expect(result.isAbsolute).to.be.true();
          expect(result.isRoot).to.be.false();
          expect(result.isRelative).to.be.false();
          expect(result.task).to.equal("");
          expect(result.prefix).to.equal("/");
          expect(result.segments).to.deep.equal([
            "abs",
            "project",
          ]);
          expect(result.path).to.equal("/abs/project");

          expect(result.toString()).to.equal("/abs/project");
        });
        it("parses an absolute with in-range '.' and '..'", () => {
          const result = new TaskPath("/abs/sub/../other/./project:task-name");

          expect(result.isAbsolute).to.be.true();
          expect(result.isRoot).to.be.false();
          expect(result.isRelative).to.be.false();
          expect(result.task).to.equal("task-name");
          expect(result.prefix).to.equal("/");
          expect(result.segments).to.deep.equal([
            "abs",
            "other",
            "project",
          ]);
          expect(result.path).to.equal("/abs/other/project");

          expect(result.toString()).to.equal("/abs/other/project:task-name");
        });
        it("throws if asbolute + '..'", () => {
          const err =
            expect(() => new TaskPath("/../project:task-name")).to.throw(
              InvalidTaskPath,
            ).actual;
          expect(err.path).to.equal("/../project:task-name");
        });
        it("throws if absolute + '.'", () => {
          const err =
            expect(() => new TaskPath("/./project:task-name")).to.throw(
              InvalidTaskPath,
            ).actual;
          expect(err.path).to.equal("/./project:task-name");
        });
      });
      describe("root", () => {
        it("parses a simple root path", () => {
          const result = new TaskPath("//root/project:task-name");

          expect(result.isAbsolute).to.be.false();
          expect(result.isRoot).to.be.true();
          expect(result.isRelative).to.be.false();
          expect(result.task).to.equal("task-name");
          expect(result.prefix).to.equal("//");
          expect(result.segments).to.deep.equal([
            "root",
            "project",
          ]);
          expect(result.path).to.equal("root/project");

          expect(result.toString()).to.equal("//root/project:task-name");
        });
        it("parses a root with not task name", () => {
          const result = new TaskPath("//root/project");

          expect(result.isAbsolute).to.be.false();
          expect(result.isRoot).to.be.true();
          expect(result.isRelative).to.be.false();
          expect(result.task).to.equal("");
          expect(result.prefix).to.equal("//");
          expect(result.segments).to.deep.equal([
            "root",
            "project",
          ]);
          expect(result.path).to.equal("root/project");

          expect(result.toString()).to.equal("//root/project");
        });
        it("parses an empty root with task name", () => {
          const result = new TaskPath("//:task-name");

          expect(result.isAbsolute).to.be.false();
          expect(result.isRoot).to.be.true();
          expect(result.isRelative).to.be.false();
          expect(result.task).to.equal("task-name");
          expect(result.prefix).to.equal("//");
          expect(result.segments).to.deep.equal([]);
          expect(result.path).to.equal("");

          expect(result.toString()).to.equal("//:task-name");
        });
        it("parses an empty root with no task name", () => {
          const result = new TaskPath("//");

          expect(result.isAbsolute).to.be.false();
          expect(result.isRoot).to.be.true();
          expect(result.isRelative).to.be.false();
          expect(result.task).to.equal("");
          expect(result.prefix).to.equal("//");
          expect(result.segments).to.deep.equal([]);
          expect(result.path).to.equal("");

          expect(result.toString()).to.equal("//");
        });
      });

      describe("escaping", () => {
        it("escapes a relative path", () => {
          const result = new TaskPath("with/relative\\/path:task-name");

          expect(result.isAbsolute).to.be.false();
          expect(result.isRoot).to.be.false();
          expect(result.isRelative).to.be.true();
          expect(result.task).to.equal("task-name");
          expect(result.segments).to.deep.equal([
            "with",
            "relative\\/path",
          ]);
          expect(result.path).to.equal("with/relative\\/path");

          expect(result.toString()).to.equal("with/relative\\/path:task-name");
        });
      });
    });

    describe(".resolveFrom()", () => {
      const rootBase = new TaskPath("//root/base:base-task");
      const absBase = new TaskPath("/abs/base:base-task");
      const relBase = new TaskPath("relative/base:base-task");

      it("returns self for absolute path", () => {
        const path = new TaskPath("/abs/path:task-name");

        expect(path.resolveFrom(absBase)).to.equal(path);
        expect(path.resolveFrom(rootBase)).to.equal(path);
        expect(path.resolveFrom(relBase)).to.equal(path);
      });
      it("returns self for root path", () => {
        const path = new TaskPath("//root/path:task-name");

        expect(path.resolveFrom(absBase)).to.equal(path);
        expect(path.resolveFrom(rootBase)).to.equal(path);
        expect(path.resolveFrom(relBase)).to.equal(path);
      });

      describe("implicit relative", () => {
        it("resolves implicit relative from absolute", () => {
          const path = new TaskPath("relative/path:task-name");

          expect(path.resolveFrom(absBase)).to.deep.equal(
            new TaskPath("/abs/base/relative/path:task-name"),
          );
        });
        it("resolve implicit relative from root", () => {
          const path = new TaskPath("relative/path:task-name");

          expect(path.resolveFrom(rootBase)).to.deep.equal(
            new TaskPath("//root/base/relative/path:task-name"),
          );
        });
        it("resolve implicit relative from relative", () => {
          const path = new TaskPath("relative/path:task-name");

          expect(path.resolveFrom(relBase)).to.deep.equal(
            new TaskPath("relative/base/relative/path:task-name"),
          );
        });
      });
      describe("parent relative", () => {
        it("resolve parent relative from relative", () => {
          const path = new TaskPath("../relative/path:task-name");

          expect(path.resolveFrom(relBase)).to.deep.equal(
            new TaskPath("relative/relative/path:task-name"),
          );
        });
        it("resolve parent parent relative from relative", () => {
          const path = new TaskPath("../../relative/path:task-name");

          expect(path.resolveFrom(relBase)).to.deep.equal(
            new TaskPath("relative/path:task-name"),
          );
        });
        it("resolves parent parent parent relative from relative", () => {
          const path = new TaskPath("../../../relative/path:task-name");

          expect(path.resolveFrom(relBase)).to.deep.equal(
            new TaskPath("../relative/path:task-name"),
          );
        });
        it("resolve parent relative from root", () => {
          const path = new TaskPath("../relative/path:task-name");

          expect(path.resolveFrom(rootBase)).to.deep.equal(
            new TaskPath("//root/relative/path:task-name"),
          );
        });
        it("resolve parent parent relative from root", () => {
          const path = new TaskPath("../../relative/path:task-name");

          expect(path.resolveFrom(rootBase)).to.deep.equal(
            new TaskPath("//relative/path:task-name"),
          );
        });
        it("throws when trying to resolve parent parent parent relative from root", () => {
          const path = new TaskPath("../../../relative/path:task-name");

          const err =
            expect(() => path.resolveFrom(rootBase)).to.throw(InvalidTaskPath)
              .actual;
          expect(err.path).to.equal(
            "//root/base/../../../relative/path:task-name",
          );
        });
        it("resolve parent relative from absolute", () => {
          const path = new TaskPath("../relative/path:task-name");

          expect(path.resolveFrom(absBase)).to.deep.equal(
            new TaskPath("/abs/relative/path:task-name"),
          );
        });
        it("resolve parent parent relative from absolute", () => {
          const path = new TaskPath("../../relative/path:task-name");

          expect(path.resolveFrom(absBase)).to.deep.equal(
            new TaskPath("/relative/path:task-name"),
          );
        });
        it("throws when trying to resolve parent parent parent relative from absolute", () => {
          const path = new TaskPath("../../../relative/path:task-name");

          const err =
            expect(() => path.resolveFrom(absBase)).to.throw(InvalidTaskPath)
              .actual;
          expect(err.path).to.equal(
            "/abs/base/../../../relative/path:task-name",
          );
        });
      });
    });

    describe(".resolvePathFrom()", () => {
      const base = {
        current: "/current/working/directory",
        root: "/root/project/directory",
      };

      it("resolves self path for absolute", () => {
        const path = new TaskPath("/abs/path/project:task-name");

        expect(path.resolvePathFrom(base)).to.equal(path.path);
      });

      it("resolves root with root", () => {
        const path = new TaskPath("//project/root:task-name");

        expect(path.resolvePathFrom(base)).to.equal(
          `${base.root}/project/root`,
        );
      });

      it("resolves empty root with root", () => {
        const path = new TaskPath("//project/root:task-name");

        expect(path.resolvePathFrom({
          current: "/current/working/directory",
        })).to.equal("project/root");
      });

      it("resolves relative with current", () => {
        const path = new TaskPath("relative/project:task-name");

        expect(path.resolvePathFrom(base)).to.equal(
          `${base.current}/relative/project`,
        );
      });

      it("resolves relative with empty current", () => {
        const path = new TaskPath("relative/project:task-name");

        expect(path.resolvePathFrom({
          root: "/root/project/directory",
        })).to.equal("relative/project");
      });
    });

    describe("TaskPath.from()", () => {
      it("returns self for TaskPath", () => {
        const path = new TaskPath("//some/project:task-name");
        const result = TaskPath.from(path);
        expect(result).to.equal(path);
      });
      it("parses for a string", () => {
        const path = "//some/project:task-name";
        const result = TaskPath.from(path);
        expect(`${result}`).to.equal("//some/project:task-name");
      });
    });
  });
});
