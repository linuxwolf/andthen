/** */

import { describe, it } from "@std/testing/bdd";
import { expect } from "../setup.ts";

import { ErrorBase, format } from "../../src/util/errors.ts";

describe("util/errors", () => {
  describe("format()", () => {
    it("formats a boolean", () => {
      let result: string;

      result = format("truthy key", { key: true });
      expect(result).to.equal("truthy key {key=true}");

      result = format("falsy key", { key: false });
      expect(result).to.equal("falsy key {key=false}");
    });
    it("formats a bigint", () => {
      const result = format("bigint key", { key: 1234567890n });
      expect(result).to.equal("bigint key {key=1234567890}");
    });
    it("formats a number", () => {
      const result = format("number key", { key: 1234567890 });
      expect(result).to.equal("number key {key=1234567890}");
    });
    it("formats a string", () => {
      const result = format("string key", { key: "some string" });
      expect(result).to.equal('string key {key="some string"}');
    });
    it("formats a function", () => {
      function doIt() {}
      const result = format("function key", { key: doIt });
      expect(result).to.equal("function key {key=function doIt}");
    });
    it("formats undefined", () => {
      const result = format("undefined key", { key: undefined });
      expect(result).to.equal("undefined key {key=undefined}");
    });
    it("formats null", () => {
      const result = format("null key", { key: null });
      expect(result).to.equal("null key {key=null}");
    });
    it("formats date key", () => {
      const result = format("date key", { key: new Date(1) });
      expect(result).to.equal("date key {key=1970-01-01T00:00:00.001Z}");
    });
    it("formats regexp key", () => {
      const ptn = /a[bc]*d/gi;
      const result = format("regular expression key", { key: ptn });
      expect(result).to.equal(`regular expression key {key=${ptn.toString()}}`);
    });

    it("formats multiple items", () => {
      const result = format("multiple details", {
        timestamp: new Date(1),
        status: "failing",
      });
      expect(result).to.equal(
        'multiple details {timestamp=1970-01-01T00:00:00.001Z; status="failing"}',
      );
    });

    describe("arrays", () => {
      it("formats a single-element array", () => {
        const result = format("single array", { key: ["value"] });
        expect(result).to.equal('single array {key=["value"]}');
      });
      it("formats an empty array", () => {
        const result = format("empty array", { key: [] });
        expect(result).to.equal("empty array {key=[]}");
      });
      it("formats multiple elements", () => {
        const result = format("array key", {
          key: [
            undefined,
            null,
            123n,
            456,
            true,
            "some value",
            /abc/gi,
            new Date(1),
          ],
        });
        expect(result).to.equal(
          'array key {key=[undefined, null, 123, 456, true, "some value", /abc/gi, 1970-01-01T00:00:00.001Z]}',
        );
      });
    });

    describe("records", () => {
      it("formats an empty record", () => {
        const result = format("empty record", { key: {} });
        expect(result).to.equal("empty record {key={}}");
      });
      it("formats a populated record", () => {
        const result = format("full record", {
          key: {
            val1: undefined,
            val2: null,
            val3: 123n,
            val4: 456,
            val5: "some value",
            val6: /abc/gi,
            val7: new Date(1),
          },
        });
        expect(result).to.equal(
          'full record {key={val1: undefined, val2: null, val3: 123, val4: 456, val5: "some value", val6: /abc/gi, val7: 1970-01-01T00:00:00.001Z}}',
        );
      });
    });
  });
  describe("class ErrorBase", () => {
    class MockError extends ErrorBase {
    }

    it("creates with just a message", () => {
      const err = new MockError("my error message");
      expect(err).to.be.an.instanceOf(Error);
      expect(err.name).to.equal("MockError");
      expect(err.message).to.equal("my error message");
    });
    it("creates with details", () => {
      const err = new MockError("my error message", {
        timestamp: new Date(1),
        state: "failing",
      });
      expect(err).to.be.an.instanceOf(Error);
      expect(err.name).to.equal("MockError");
      expect(err.message).to.equal(
        'my error message {timestamp=1970-01-01T00:00:00.001Z; state="failing"}',
      );
    });
  });
});
