import { describe, expect, it } from "../deps.ts";

import { checkName, validateName } from "../../src/util/naming.ts";
import * as errors from "../../src/errors/mod.ts";

describe("util/naming", () => {
  describe("validateName()", () => {
    describe("successes", () => {
      it("supports a simple name", () => {
        const result = validateName("simple");
        expect(result).to.be.true;
      });
      it("supports a name with digits", () => {
        const result = validateName("simple42");
        expect(result).to.be.true;
      });
      it("supports just digits", () => {
        const result = validateName("20221017");
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
          const result = validateName(name);
          expect(result, `validating ${name}`).to.be.true;
        }
      });
      it("supports a full mix", () => {
        const result = validateName("test_100.this-is");
        expect(result).to.be.true;
      });
    });
    describe("edge successes", () => {
      it("supports just a letter", () => {
        const result = validateName("a");
        expect(result).to.be.true;
      });
      it("supports just a digit", () => {
        const result = validateName("3");
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
          const result = validateName(name);
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
          const result = validateName(name);
          expect(result, `validating ${name}`).to.be.true;
        }
      });
    });

    describe("failures", () => {
      it("falis on spaces", () => {
        const result = validateName("invalid name");
        expect(result).to.be.false;
      });
      it("fails on leading spaces", () => {
        const result = validateName("  invalid-name");
        expect(result).to.be.false;
      });
      it("fails on too many symbols", () => {
        const result = validateName("$$");
        expect(result).to.be.false;
      });
    });

    describe("empty", () => {
      it("fails if empty", () => {
        const result = validateName("");
        expect(result).to.be.false;
      });
      it("succeeds if allowEmpty is true", () => {
        const result = validateName("", true);
        expect(result).to.be.true;
      });
    });
  });

  describe("validateName()", () => {
    describe("successes", () => {
      it("supports a simple name", () => {
        const result = checkName("simple");
        expect(result).to.equal("simple");
      });
      it("supports a name with digits", () => {
        const result = checkName("simple42");
        expect(result).to.equal("simple42");
      });
      it("supports just digits", () => {
        const result = checkName("20221017");
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
          const result = checkName(name);
          expect(result, `checking ${name}`).to.equal(name);
        }
      });
      it("supports a full mix", () => {
        const result = checkName("test_100.this-is");
        expect(result).to.equal("test_100.this-is");
      });
    });
    describe("edge successes", () => {
      it("supports just a letter", () => {
        const result = checkName("a");
        expect(result).to.equal("a");
      });
      it("supports just a digit", () => {
        const result = checkName("3");
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
          const result = checkName(name);
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
          const result = checkName(name);
          expect(result, `checking ${name}`).to.equal(name);
        }
      });
    });

    describe("failures", () => {
      it("falis on spaces", () => {
        expect(() => checkName("invalid name"))
          .to.throw(errors.InvalidName)
          .and.have.property("value", "invalid name");
      });
      it("fails on leading spaces", () => {
        expect(() => checkName("  invalid-name"))
          .to.throw(errors.InvalidName)
          .and.have.property("value", "  invalid-name");
      });
      it("fails on too many symbols", () => {
        expect(() => checkName("$$"))
          .to.throw(errors.InvalidName)
          .and.have.property("value", "$$");
      });
    });

    describe("empty", () => {
      it("fails if empty", () => {
        expect(() => checkName(""))
          .to.throw(errors.InvalidName)
          .and.have.property("value", "");
      });
      it("succeeds if allowEmpty is true", () => {
        const result = checkName("", true);
        expect(result).to.equal("");
      });
    });
  });
});
