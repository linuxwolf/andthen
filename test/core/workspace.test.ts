import { describe, expect, it } from "../deps.ts";

import { parse } from "../../src/core/workspace.ts";

describe("core/workspace", () => {
  describe("Target", () => {
    describe("simple cases", () => {
      it("parses a single path task", () => {
        const result = parse("simple:task");
        expect(result.absolute).to.be.false;
        expect(result.path).to.equal("simple");
        expect(result.segments).to.deep.equal(["simple"]);
        expect(result.task).to.equal("task");
        expect(result.toString()).to.equal("simple:task");
      });
      it("parses a simple path task", () => {
        const result = parse("simple/path:task");
        expect(result.absolute).to.be.false;
        expect(result.path).to.equal("simple/path");
        expect(result.segments).to.deep.equal(["simple", "path"]);
        expect(result.task).to.equal("task");
        expect(result.toString()).to.equal("simple/path:task");
      });
      it("parses a single implied task", () => {
        const result = parse("simple");
        expect(result.absolute).to.be.false;
        expect(result.path).to.equal("simple");
        expect(result.segments).to.deep.equal(["simple"]);
        expect(result.task).to.equal("default");
        expect(result.toString()).to.equal("simple:default");
      });
      it("parses a simple implied task", () => {
        const result = parse("simple/path");
        expect(result.absolute).to.be.false;
        expect(result.path).to.equal("simple/path");
        expect(result.segments).to.deep.equal(["simple", "path"]);
        expect(result.task).to.equal("default");
        expect(result.toString()).to.equal("simple/path:default");
      });
    });

    describe("absolute paths", () => {
      it("parses a single absolute target", () => {
        const result = parse("/root:task");
        expect(result.absolute).to.be.true;
        expect(result.path).to.equal("/root");
        expect(result.segments).to.deep.equal(["root"]);
        expect(result.task).to.equal("task");
        expect(result.toString()).to.equal("/root:task");
      });
      it("parses a nested absolute target", () => {
        const result = parse("/root/path/project:task");
        expect(result.absolute).to.be.true;
        expect(result.path).to.equal("/root/path/project");
        expect(result.segments).to.deep.equal(["root", "path", "project"]);
        expect(result.task).to.equal("task");
        expect(result.toString()).to.equal("/root/path/project:task");
      });
      it("parses single absolute implied task", () => {
        const result = parse("/root");
        expect(result.absolute).to.be.true;
        expect(result.path).to.equal("/root");
        expect(result.segments).to.deep.equal(["root"]);
        expect(result.task).to.equal("default");
        expect(result.toString()).to.equal("/root:default");
      });
      it("parses a nested absolute implied target", () => {
        const result = parse("/root/path/project");
        expect(result.absolute).to.be.true;
        expect(result.path).to.equal("/root/path/project");
        expect(result.segments).to.deep.equal(["root", "path", "project"]);
        expect(result.task).to.equal("default");
        expect(result.toString()).to.equal("/root/path/project:default");
      });
    });

    describe("simple relative", () => {
      it("parses a relative-parent path task", () => {
        const result = parse("../simple:task");
        expect(result.absolute).to.be.false;
        expect(result.path).to.equal("../simple");
        expect(result.segments).to.deep.equal(["..", "simple"]);
        expect(result.task).to.equal("task");
        expect(result.toString()).to.equal("../simple:task");
      });

      it("parses a relative-self path task", () => {
        const result = parse("./simple:task");
        expect(result.absolute).to.be.false;
        expect(result.path).to.equal("simple");
        expect(result.segments).to.deep.equal(["simple"]);
        expect(result.task).to.equal("task");
        expect(result.toString()).to.equal("simple:task");
      });
    });

    describe("complex relative", () => {
      it("collapses intermediate relative paths", () => {
        const result = parse("complex/./path/../project:task");
        expect(result.absolute).to.be.false;
        expect(result.path).to.equal("complex/project");
        expect(result.segments).to.deep.equal(["complex", "project"]);
        expect(result.task).to.equal("task");
        expect(result.toString()).to.equal("complex/project:task");
      });
      it("keeps deep parent-relative paths", () => {
        const result = parse("../../complex/path:task");
        expect(result.absolute).to.be.false;
        expect(result.path).to.equal("../../complex/path");
        expect(result.segments).to.deep.equal(["..", "..", "complex", "path"]);
        expect(result.task).to.equal("task");
        expect(result.toString()).to.equal("../../complex/path:task");
      });
      it("strips intermediate self-relative between parent-relatives", () => {
        const result = parse(".././../complex/path:task");
        expect(result.absolute).to.be.false;
        expect(result.path).to.equal("../../complex/path");
        expect(result.segments).to.deep.equal(["..", "..", "complex", "path"]);
        expect(result.task).to.equal("task");
        expect(result.toString()).to.equal("../../complex/path:task");
      });
    });

    it("parses an empty string", () => {
      const result = parse("");
      expect(result.absolute).to.be.false;
      expect(result.path).to.equal("");
      expect(result.segments).to.deep.equal([]);
      expect(result.task).to.equal("default");
      expect(result.toString()).to.equal(":default");
    });
    it("parses just  '/'", () => {
      const result = parse("/");
      expect(result.absolute).to.be.true;
      expect(result.path).to.equal("/");
      expect(result.segments).to.deep.equal([]);
      expect(result.task).to.equal("default");
      expect(result.toString()).to.equal("/:default");
    });
  });
});
