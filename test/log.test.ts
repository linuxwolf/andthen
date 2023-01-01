import { afterEach, beforeEach, describe, expect, it, sinon } from "./deps.ts";

import {
  formatString,
  getLogger,
  LogLevels,
  quiet,
  record,
  startAt,
  verbose,
} from "../src/log.ts";

describe("log", () => {
  describe("formatter", () => {
    const now = new Date("2022-12-04T11:22:33Z");
    let clock: sinon.SinonFakeTimers;

    beforeEach(() => {
      clock = sinon.useFakeTimers(now);
      startAt(now);
    });
    afterEach(() => {
      clock.restore();
    });

    it("formats the LogRecord", () => {
      const rec = record({
        level: LogLevels.INFO,
        msg: "this is a test log",
      });
      const result = formatString(rec);
      expect(result).to.equal(
        `0ms INFO - this is a test log`,
      );
    });
    it("formats the LogRecord with milliseconds elapsed", () => {
      clock.tick(250);
      const rec = record({
        level: LogLevels.INFO,
        msg: "this is a test log",
      });
      const result = formatString(rec);
      expect(result).to.equal(
        `250ms INFO - this is a test log`,
      );
    });    
    it("formats the LogRecord with seconds elapsed", () => {
      clock.tick(25000);  // 25 seconds
      const rec = record({
        level: LogLevels.INFO,
        msg: "this is a test log",
      });
      const result = formatString(rec);
      expect(result).to.equal(
        `25000ms INFO - this is a test log`,
      );
    });    
    it("formats the LogRecord with minutes elapsed", () => {
      clock.tick(300000); // 5 minutes
      const rec = record({
        level: LogLevels.INFO,
        msg: "this is a test log",
      });
      const result = formatString(rec);
      expect(result).to.equal(
        `300000ms INFO - this is a test log`,
      );
    });    
    it("formats the LogRecord with hours elapsed", () => {
      clock.tick(10800000); // 3 hours
      const rec = record({
        level: LogLevels.INFO,
        msg: "this is a test log",
      });
      const result = formatString(rec);
      expect(result).to.equal(
        `10800000ms INFO - this is a test log`,
      );
    });
    it("formats the LogRecord with days elapsed", () => {
      clock.tick(2764800000); // 32 days
      const rec = record({
        level: LogLevels.INFO,
        msg: "this is a test log",
      });
      const result = formatString(rec);
      expect(result).to.equal(
        `2764800000ms INFO - this is a test log`,
      );
    });
  });
  describe("defaults", () => {
    it("configures defaults", () => {
      const log = getLogger();
      expect(log.levelName).to.equal("INFO");
      expect(log.handlers[0].formatter).to.equal(formatString);
    });
  });
  describe("quiet/verbose", () => {
    afterEach(() => {
      getLogger().levelName = "INFO";
    });

    it("noisier on `verbose()`", () => {
      verbose();
      expect(getLogger().levelName).to.equal("DEBUG");
    });
    it("quiter on `quiet()`", () => {
      quiet();
      expect(getLogger().levelName).to.equal("WARNING");
    });
  });
});
