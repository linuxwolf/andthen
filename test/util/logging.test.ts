/** */

import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { expect, mock } from "../setup.ts";

import { getLogger, reset } from "@logtape/logtape";
import type { LogLevel, LogRecord } from "@logtape/logtape";
import * as colors from "@std/fmt/colors";
import logger, {
  detailedFormatter,
  setup,
  simpleFormatter,
} from "../../src/util/logging.ts";

interface LogVector {
  level: LogLevel;
  record: Partial<LogRecord>;
  expected: string;
}

describe("util/logging", () => {
  describe("simpleFormatter()", () => {
    const vectors: LogVector[] = [
      {
        level: "debug",
        record: {
          category: ["app", "testing"],
          timestamp: 45296789,
          properties: {},
        },
        expected: "this is a debug message 123456789",
      },
      {
        level: "info",
        record: {
          category: ["app", "testing"],
          timestamp: 45296789,
          properties: {},
        },
        expected: "this is a info message 123456789",
      },
      {
        level: "warning",
        record: {
          category: ["app", "testing"],
          timestamp: 45296789,
          properties: {},
        },
        expected: "this is a warning message 123456789",
      },
      {
        level: "error",
        record: {
          category: ["app", "testing"],
          timestamp: 45296789,
          properties: {},
        },
        expected: "this is a error message 123456789",
      },
      {
        level: "fatal",
        record: {
          category: ["app", "testing"],
          timestamp: 45296789,
          properties: {},
        },
        expected: "this is a fatal message 123456789",
      },
    ];

    for (const v of vectors) {
      it(`formats a ${v.level} simple record`, () => {
        const record = {
          ...v.record,
          level: v.level,
          message: [
            "this is a ",
            v.level,
            " message ",
            123456789,
            "",
          ],
        } as LogRecord;
        const result = simpleFormatter(record);
        expect(result).to.equal(v.expected);
      });
    }
  });

  describe("detailedFormatter()", () => {
    const vectors = [
      {
        level: "debug",
        record: {
          category: ["app", "testing"],
          timestamp: 45296789,
          properties: {},
        },
        expected: `1970-01-01T12:34:56.789Z [${
          colors.blue("debug")
        }  ] testing: this is a debug message 123456789`,
      },
      {
        level: "info",
        record: {
          category: ["app", "testing"],
          timestamp: 45296789,
          properties: {},
        },
        expected: `1970-01-01T12:34:56.789Z [${
          colors.green("info")
        }   ] testing: this is a info message 123456789`,
      },
      {
        level: "warning",
        record: {
          category: ["app", "testing"],
          timestamp: 45296789,
          properties: {},
        },
        expected: `1970-01-01T12:34:56.789Z [${
          colors.yellow("warning")
        }] testing: this is a warning message 123456789`,
      },
      {
        level: "error",
        record: {
          category: ["app", "testing"],
          timestamp: 45296789,
          properties: {},
        },
        expected: `1970-01-01T12:34:56.789Z [${
          colors.red("error")
        }  ] testing: this is a error message 123456789`,
      },
      {
        level: "fatal",
        record: {
          category: ["app", "testing"],
          timestamp: 45296789,
          properties: {},
        },
        expected: `1970-01-01T12:34:56.789Z [${
          colors.brightMagenta("fatal")
        }  ] testing: this is a fatal message 123456789`,
      },
    ];

    for (const v of vectors) {
      it(`formats a ${v.level} detailed record`, () => {
        const record = {
          ...v.record,
          level: v.level,
          message: [
            "this is a ",
            v.level,
            " message ",
            123456789,
            "",
          ],
        } as LogRecord;
        const result = detailedFormatter(record);
        expect(result).to.equal(v.expected);
      });
    }
  });

  describe("setup()", () => {
    let spyStderrWriteSync: mock.Spy;

    beforeEach(() => {
      spyStderrWriteSync = mock.spy(Deno.stderr, "writeSync");
    });

    afterEach(async () => {
      spyStderrWriteSync.restore();
      await reset();
    });

    describe("levels", () => {
      it("initializes quiet mode", async () => {
        await setup({
          quiet: true,
        });
        const logger = getLogger(["app"]);

        logger.debug`this is a debug log message`;
        logger.info`this is an info log message`;
        logger.warn`this is a warning log message`;
        logger.error`this is an error log message`;
        logger.fatal`this is a fatal log message`;
  
        expect(spyStderrWriteSync).to.have.been.called(3);
        expect(spyStderrWriteSync).to.have.been.deep.calledWith([
          new TextEncoder().encode("this is a warning log message\n"),
        ]);
        expect(spyStderrWriteSync).to.have.been.deep.calledWith([
          new TextEncoder().encode("this is an error log message\n"),
        ]);
        expect(spyStderrWriteSync).to.have.been.deep.calledWith([
          new TextEncoder().encode("this is a fatal log message\n"),
        ]);
      });

      it("intializes with verbose mode", async () => {
        await setup({
          verbose: true,
        });
        const logger = getLogger(["app"]);

        logger.debug`this is a debug log message`;
        logger.info`this is an info log message`;
        logger.warn`this is a warning log message`;
        logger.error`this is an error log message`;
        logger.fatal`this is a fatal log message`;
  
        expect(spyStderrWriteSync).to.have.been.called(5);
        expect(spyStderrWriteSync).to.have.been.deep.calledWith([
          new TextEncoder().encode("this is a debug log message\n"),
        ]);
        expect(spyStderrWriteSync).to.have.been.deep.calledWith([
          new TextEncoder().encode("this is an info log message\n"),
        ]);
        expect(spyStderrWriteSync).to.have.been.deep.calledWith([
          new TextEncoder().encode("this is a warning log message\n"),
        ]);
        expect(spyStderrWriteSync).to.have.been.deep.calledWith([
          new TextEncoder().encode("this is an error log message\n"),
        ]);
        expect(spyStderrWriteSync).to.have.been.deep.calledWith([
          new TextEncoder().encode("this is a fatal log message\n"),
        ]);
      });
    });

    it("initializes with defaults", async () => {
      await setup({});
      const logger = getLogger(["app"]);

      logger.debug`this is a debug log message`;
      logger.info`this is an info log message`;
      logger.warn`this is a warning log message`;
      logger.error`this is an error log message`;
      logger.fatal`this is a fatal log message`;

      expect(spyStderrWriteSync).to.have.been.called(4);
      expect(spyStderrWriteSync).to.have.been.deep.calledWith([
        new TextEncoder().encode("this is an info log message\n"),
      ]);
      expect(spyStderrWriteSync).to.have.been.deep.calledWith([
        new TextEncoder().encode("this is a warning log message\n"),
      ]);
      expect(spyStderrWriteSync).to.have.been.deep.calledWith([
        new TextEncoder().encode("this is an error log message\n"),
      ]);
      expect(spyStderrWriteSync).to.have.been.deep.calledWith([
        new TextEncoder().encode("this is a fatal log message\n"),
      ]);
    });
  });

  describe("default logger()", () => {
    beforeEach(async () => {
      await setup({});
    });

    afterEach(async () => {
      await reset();
    });

    it("obtains the default 'app' logger", () => {
      const log = logger();
      expect(log).to.deep.equal(getLogger(["app"]));
    });

    it("obtains a child of the 'app' logger", () => {
      const log = logger("task");
      expect(log).to.deep.equal(getLogger(["app", "task"]));
    });
  });
});
