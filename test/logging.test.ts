/** */

import { afterAll, describe, it } from "deno_std/testing/bdd.ts";
import { FakeTime } from "deno_std/testing/time.ts";
import { expect } from "expecto/index.ts";

import { LogLevel, format, getLevelForName, getNameForLevel } from "../src/logging.ts";
import { InvalidLogLevel } from "../src/errors.ts";

describe("logging", () => {
  describe("LogLevel", () => {
    it("retrieves the name for the given level", () => {
      expect(getNameForLevel(LogLevel.OFF)).to.equal("OFF");
      expect(getNameForLevel(LogLevel.DEBUG)).to.equal("DEBUG");
      expect(getNameForLevel(LogLevel.VERBOSE)).to.equal("VERBOSE");
      expect(getNameForLevel(LogLevel.INFO)).to.equal("INFO");
      expect(getNameForLevel(LogLevel.WARNING)).to.equal("WARNING");
      expect(getNameForLevel(LogLevel.ERROR)).to.equal("ERROR");
      expect(getNameForLevel(LogLevel.ALL)).to.equal("ALL");
    });
    it("retrieves the level for the given name", () => {
      expect(getLevelForName("OFF")).to.equal(LogLevel.OFF);
      expect(getLevelForName("DEBUG")).to.equal(LogLevel.DEBUG);
      expect(getLevelForName("VERBOSE")).to.equal(LogLevel.VERBOSE);
      expect(getLevelForName("INFO")).to.equal(LogLevel.INFO);
      expect(getLevelForName("WARNING")).to.equal(LogLevel.WARNING);
      expect(getLevelForName("ERROR")).to.equal(LogLevel.ERROR);
      expect(getLevelForName("ALL")).to.equal(LogLevel.ALL);
    });
    it("throws if name is not known", () => {
      const err = expect(() => getLevelForName("invalid")).to.throw(InvalidLogLevel).actual;
      expect(err.level).to.equal("invalid");
    });
  });

  describe("format()", () => {
    const time = new FakeTime(19760126);

    afterAll(() => {
      time.restore();
    });

    it("formats a string message", () => {
      const record = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: "this is a log message",
      };
      const result = format(record);
      expect(result).to.equal(
        `${record.timestamp.toISOString()} [${getNameForLevel(record.level)}]: ${record.message}`,
      );
    });
    it("formats a function message", () => {
      const record = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: () => ("this is a returned log message"),
      };
      const result = format(record);
      expect(result).to.equal(
        `${record.timestamp.toISOString()} [${getNameForLevel(record.level)}]: ${record.message()}`,
      );
    });
  });
});
