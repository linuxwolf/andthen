import { afterEach, beforeEach, describe, expect, it, sinon } from "./deps.ts";

import {
  formatString,
  getLogger,
  LogLevels,
  quiet,
  record,
  verbose,
} from "../src/log.ts";

describe("log", () => {
  describe("formatter", () => {
    const now = new Date("2022-12-04T11:22:33Z");
    let clock: sinon.SinonFakeTimers;

    beforeEach(() => {
      clock = sinon.useFakeTimers(now);
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
        `[INFO] ${now.toISOString()}: this is a test log`,
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
