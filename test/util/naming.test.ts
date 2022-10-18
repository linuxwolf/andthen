import { describe, expect, it } from "../deps.ts";

import { InvalidNameError } from "../../src/util/errs.ts";
import { check, validate } from "../../src/util/naming.ts";

describe("util/naming", () => {
  describe("validate()", () => {
    describe("successes", () => {
      it("supports a simple name", () => {
        const result = validate("simple");
        expect(result).to.be.true;
      });
      it("supports a name with digits", () => {
        const result = validate("simple42");
        expect(result).to.be.true;
      });
      it("supports just digits", () => {
        const result = validate("20221017");
        expect(result).to.be.true;
      });
      it("supports some symbols", () => {
        const names = [
          "test-task",
          "test.task",
          "test_task",
          "test:task",
          "test$task",
        ];
        for (const name of names) {
          const result = validate(name);
          expect(result, `validating ${name}`).to.be.true;
        }
      });
      it("supports a full mix", () => {
        const result = validate("test_100.this-is");
        expect(result).to.be.true;
      });
    });
    describe("edge successes", () => {
      it("supports just a letter", () => {
        const result = validate("a");
        expect(result).to.be.true;
      });
      it("supports just a digit", () => {
        const result = validate("3");
        expect(result).to.be.true;
      });
      it("supports a leading symbol", () => {
        const names = [
          "-testtask",
          ".testtask",
          "_testtask",
          ":testtask",
          "$testtask",
        ];
        for (const name of names) {
          const result = validate(name);
          expect(result, `validating ${name}`).to.be.true;
        }
      });
      it("supports a trailing symbol", () => {
        const names = [
          "testtask-",
          "testtask.",
          "testtask_",
          "testtask:",
          "testtask$",
        ];
        for (const name of names) {
          const result = validate(name);
          expect(result, `validating ${name}`).to.be.true;
        }
      });
    });

    describe("failures", () => {
      it("falis on spaces", () => {
        const result = validate("invalid name");
        expect(result).to.be.false;
      });
      it("fails on leading spaces", () => {
        const result = validate("  invalid-name");
        expect(result).to.be.false;
      });
      it("fails on too many symbols", () => {
        const result = validate("$$");
        expect(result).to.be.false;
      });
    });

    describe("empty", () => {
      it("fails if empty", () => {
        const result = validate("");
        expect(result).to.be.false;
      });
      it("succeeds if allowEmpty is true", () => {
        const result = validate("", true);
        expect(result).to.be.true;
      });
    });
  });

  describe("check()", () => {
    describe("successes", () => {
      it("supports a simple name", () => {
        const result = check("simple");
        expect(result).to.equal("simple")
      });
      it("supports a name with digits", () => {
        const result = check("simple42");
        expect(result).to.equal("simple42");
      });
      it("supports just digits", () => {
        const result = check("20221017");
        expect(result).to.equal("20221017");
      });
      it("supports some symbols", () => {
        const names = [
          "test-task",
          "test.task",
          "test_task",
          "test:task",
          "test$task",
        ];
        for (const name of names) {
          const result = check(name);
          expect(result, `checking ${name}`).to.equal(name);
        }
      });
      it("supports a full mix", () => {
        const result = check("test_100.this-is");
        expect(result).to.equal("test_100.this-is");
      });
    });
    describe("edge successes", () => {
      it("supports just a letter", () => {
        const result = check("a");
        expect(result).to.equal("a");
      });
      it("supports just a digit", () => {
        const result = check("3");
        expect(result).to.equal("3");
      });
      it("supports a leading symbol", () => {
        const names = [
          "-testtask",
          ".testtask",
          "_testtask",
          ":testtask",
          "$testtask",
        ];
        for (const name of names) {
          const result = check(name);
          expect(result, `checking ${name}`).to.equal(name);
        }
      });
      it("supports a trailing symbol", () => {
        const names = [
          "testtask-",
          "testtask.",
          "testtask_",
          "testtask:",
          "testtask$",
        ];
        for (const name of names) {
          const result = check(name);
          expect(result, `checking ${name}`).to.equal(name);
        }
      });
    });

    describe("failures", () => {
      it("falis on spaces", () => {
        expect(() => check("invalid name")).
            to.throw(InvalidNameError).
            and.have.property("value", "invalid name");
      });
      it("fails on leading spaces", () => {
        expect(() => check("  invalid-name")).
            to.throw(InvalidNameError).
            and.have.property("value", "  invalid-name");
      });
      it("fails on too many symbols", () => {
        expect(() => check("$$")).
            to.throw(InvalidNameError).
            and.have.property("value", "$$");
      });
    });

    describe("empty", () => {
      it("fails if empty", () => {
        expect(() => check("")).
            to.throw(InvalidNameError).
            and.have.property("value", "");
      });
      it("succeeds if allowEmpty is true", () => {
        const result = check("", true);
        expect(result).to.equal("");
      });
    });
  });
});
