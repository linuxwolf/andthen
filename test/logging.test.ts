/** */

import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  it,
} from "deno_std/testing/bdd.ts";
import { FakeTime } from "deno_std/testing/time.ts";
import { expect, mock } from "./mocking.ts";

import log, {
  format,
  getLevelForName,
  getNameForLevel,
  Logger,
  LogLevel,
  LogMessage,
} from "../src/logging.ts";
import { InvalidLogLevel } from "../src/errors.ts";

describe("logging", () => {
  const time = new FakeTime(19760126);

  afterAll(() => {
    time.restore();
  });

  describe("LogLevel", () => {
    it("retrieves the name for the given level", () => {
      expect(getNameForLevel(LogLevel.OFF)).to.equal("OFF");
      expect(getNameForLevel(LogLevel.DEBUG)).to.equal("DEBUG");
      expect(getNameForLevel(LogLevel.VERBOSE)).to.equal("VERBOSE");
      expect(getNameForLevel(LogLevel.INFO)).to.equal("INFO");
      expect(getNameForLevel(LogLevel.WARN)).to.equal("WARN");
      expect(getNameForLevel(LogLevel.ERROR)).to.equal("ERROR");
      expect(getNameForLevel(LogLevel.ALL)).to.equal("ALL");
    });
    it("retrieves the level for the given name", () => {
      expect(getLevelForName("OFF")).to.equal(LogLevel.OFF);
      expect(getLevelForName("DEBUG")).to.equal(LogLevel.DEBUG);
      expect(getLevelForName("VERBOSE")).to.equal(LogLevel.VERBOSE);
      expect(getLevelForName("INFO")).to.equal(LogLevel.INFO);
      expect(getLevelForName("WARN")).to.equal(LogLevel.WARN);
      expect(getLevelForName("ERROR")).to.equal(LogLevel.ERROR);
      expect(getLevelForName("ALL")).to.equal(LogLevel.ALL);
    });
    it("throws if name is not known", () => {
      const err =
        expect(() => getLevelForName("invalid")).to.throw(InvalidLogLevel)
          .actual;
      expect(err.level).to.equal("invalid");
    });
  });

  describe("format()", () => {
    it("formats a string message", () => {
      const record = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: "this is a log message",
      };
      const result = format(record);
      expect(result).to.equal(
        `${record.timestamp.toISOString()} [${
          getNameForLevel(record.level)
        }]: ${record.message}`,
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
        `${record.timestamp.toISOString()} [${
          getNameForLevel(record.level)
        }]: ${record.message()}`,
      );
    });
  });

  describe("Logger", () => {
    const writer: Deno.WriterSync = {
      writeSync(_p: Uint8Array): number {
        return 0;
      },
    };
    const timestamp = new Date();
    let writeSyncStub = mock.stub(writer, "writeSync");

    function stubWriter(): mock.Stub {
      if (!writeSyncStub.restored) {
        writeSyncStub.restore();
      }

      writeSyncStub = mock.stub(writer, "writeSync");
      return writeSyncStub;
    }

    beforeEach(() => {
      stubWriter();
    });
    afterEach(() => {
      writeSyncStub.restore();
    });

    describe("ctor", () => {
      it("creates a new Logger with defaults", () => {
        const log = new Logger();
        expect(log.level).to.equal(LogLevel.INFO);
        expect(log.levelName).to.equal("INFO");
        expect(log.writer).to.equal(Deno.stderr);
      });
      it("creates a new Logger with level", () => {
        const log = new Logger(LogLevel.DEBUG);
        expect(log.level).to.equal(LogLevel.DEBUG);
        expect(log.levelName).to.equal("DEBUG");
        expect(log.writer).to.equal(Deno.stderr);
      });
      it("creates a new Logger with level + writer", () => {
        const log = new Logger(LogLevel.DEBUG, writer);
        expect(log.level).to.equal(LogLevel.DEBUG);
        expect(log.levelName).to.equal("DEBUG");
        expect(log.writer).to.equal(writer);
      });
    });

    describe("levels", () => {
      let logger: Logger;

      beforeEach(() => {
        logger = new Logger();
      });

      it("gets quieter until OFF", () => {
        let retval: LogLevel;

        expect(logger.level).to.equal(LogLevel.INFO);

        retval = logger.quieter();
        expect(retval).to.equal(LogLevel.WARN);
        expect(logger.level).to.equal(LogLevel.WARN);

        retval = logger.quieter();
        expect(retval).to.equal(LogLevel.ERROR);
        expect(logger.level).to.equal(LogLevel.ERROR);

        retval = logger.quieter();
        expect(retval).to.equal(LogLevel.OFF);
        expect(logger.level).to.equal(LogLevel.OFF);

        retval = logger.quieter();
        expect(retval).to.equal(LogLevel.OFF);
        expect(logger.level).to.equal(LogLevel.OFF);
      });
      it("gets louder until ALL", () => {
        let retval: LogLevel;

        expect(logger.level).to.equal(LogLevel.INFO);

        retval = logger.louder();
        expect(retval).to.equal(LogLevel.VERBOSE);
        expect(logger.level).to.equal(LogLevel.VERBOSE);

        retval = logger.louder();
        expect(retval).to.equal(LogLevel.DEBUG);
        expect(logger.level).to.equal(LogLevel.DEBUG);

        retval = logger.louder();
        expect(retval).to.equal(LogLevel.ALL);
        expect(logger.level).to.equal(LogLevel.ALL);

        retval = logger.louder();
        expect(retval).to.equal(LogLevel.ALL);
        expect(logger.level).to.equal(LogLevel.ALL);
      });
    });

    describe("logs", () => {
      type LoggerFunc = (msg: LogMessage) => void;

      const levels = [
        LogLevel.DEBUG,
        LogLevel.VERBOSE,
        LogLevel.INFO,
        LogLevel.WARN,
        LogLevel.ERROR,
      ];

      function bindAll(log: Logger): [LogLevel, LoggerFunc][] {
        return levels.map((lvl) => {
          const fnName = getNameForLevel(lvl).toLowerCase() as keyof Logger;
          const fn = log[fnName] as LoggerFunc;

          return [lvl, fn.bind(log)];
        });
      }

      it("writes for 'all' levels", () => {
        const log = new Logger(LogLevel.ALL, writer);
        const methods = bindAll(log);

        for (const [lvl, fn] of methods) {
          const lvlName = getNameForLevel(lvl);
          const msg = `this is a ${lvlName} message`;
          const ts = timestamp.toISOString();

          fn(msg);
          expect(writeSyncStub).to.have.been.deep.calledWith([
            (new TextEncoder()).encode(`${ts} [${lvlName}]: ${msg}\n`),
          ]);
        }
      });
      it("doesn't write for 'off' levels", () => {
        const log = new Logger(LogLevel.OFF, writer);
        const methods = bindAll(log);

        for (const [lvl, fn] of methods) {
          const lvlName = getNameForLevel(lvl);
          const msg = `this is a ${lvlName} message`;

          fn(msg);
          expect(writeSyncStub).to.not.have.been.called();
        }
        expect(writeSyncStub).to.not.have.been.called();
      });

      for (const minLevel of levels) {
        it(`writes for ${getNameForLevel(minLevel)} or higher`, () => {
          const log = new Logger(minLevel, writer);
          const methods = bindAll(log);

          for (const [lvl, fn] of methods) {
            const lvlName = getNameForLevel(lvl);
            const msg = `this is a ${lvlName} message`;
            const ts = timestamp.toISOString();

            stubWriter();
            fn(msg);

            if (minLevel > lvl) {
              expect(writeSyncStub).to.not.have.been.called();
            } else {
              const expected = (new TextEncoder()).encode(
                `${ts} [${lvlName}]: ${msg}\n`,
              );
              expect(writeSyncStub).to.have.been.deep.calledWith([expected]);
            }
          }
        });
      }
    });
  });

  describe("default", () => {
    it("exports a default logger", () => {
      expect(log.level).to.equal(LogLevel.INFO);
      expect(log.writer).to.equal(Deno.stderr);
    });
  });
});
