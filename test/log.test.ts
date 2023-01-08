import { afterEach, beforeEach, describe, expect, it, sinon } from "./deps.ts";

import logging, {
  asString,
  Logger,
  getLogger,
  setLogger,
  LogRecord,
  Level,
  compareLevels,
  softer,
  louder,
} from "../src/log.ts";
import { fmt, io } from "../src/deps.ts";

describe("log", () => {
  const now = new Date("2022-12-04T11:22:33Z");
  let clock: sinon.SinonFakeTimers;

  beforeEach(() => {
    clock = sinon.useFakeTimers(now);
    setLogger();
  });
  afterEach(() => {
    clock.restore();
    setLogger();
  });

  describe("asString()", () => {
    it("returns the same string as provided", () => {
      const input = "some string";
      expect(asString(input)).to.equal(input);
    });
    it("stringifies a primitive", () => {
      expect(asString(123456789123456789n)).to.equal("123456789123456789");
      expect(asString(true)).to.equal("true");
      expect(asString(false)).to.equal("false");
      expect(asString(42)).to.equal("42");
      expect(asString(Symbol("foo"))).to.equal("Symbol(foo)");
      expect(asString(undefined)).to.equal("undefined");
    });
    it("stringifies null", () => {
      expect(asString(null)).to.equal("null");
    });
    it("stringifies an Error", () => {
      const err = new Error("some error");
      expect(asString(err)).to.equal(err.stack);
    });
    it("stringifies a Date", () => {
      const ts = new Date();
      expect(asString(ts)).to.equal(ts.toISOString());
    });
    it("stringifies an array", () => {
      const arr = [1, "foo", true];
      expect(asString(arr)).to.equal(JSON.stringify(arr));
    });
    it("stringifies a plain object", () => {
      const obj = {
        "foo": "foo value",
        "bar": 42,
        "baz": true,
      };
      expect(asString(obj)).to.equal(JSON.stringify(obj));
    });
  });

  describe("compareLevels()", () => {
    it("returns 0 for the same level", () => {
      const result = compareLevels(Level.INFO, Level.INFO);
      expect(result).to.equal(0);
    });
    it("returns less than 0 if `a` is before `b`", () => {
      const result = compareLevels(Level.INFO, Level.ERROR);
      expect(result).to.be.lessThan(0);
    });
    it("returns greater than 0 if `a` is after `b`", () => {
      const result = compareLevels(Level.INFO, Level.DEBUG);
      expect(result).to.be.greaterThan(0);
    });
  });

  describe("LogRecord", () => {
    describe("ctor", () => {
      it("creates with implicit timestamp", () => {
        const result = new LogRecord(Level.INFO, "some info message");
        expect(result.level).to.equal(Level.INFO);
        expect(result.message).to.equal("some info message");
        expect(result.timestamp).to.deep.equal(now);
      });
      it("creates with an explicit timestamp", () => {
        const ts = new Date();
        const result = new LogRecord(Level.INFO, "some info message", ts);
        expect(result.level).to.equal(Level.INFO);
        expect(result.message).to.equal("some info message");
        expect(result.timestamp).to.equal(ts);
      });
    });
    describe(".withLevel()", () => {
      it("creates a new LogRecord with the specified level", () => {
        const ts = new Date();
        const record = new LogRecord(Level.DEBUG, "some log message", ts);
        const result = record.withLevel(Level.INFO);
        expect(result.level).to.equal(Level.INFO);
        expect(result.message).to.equal(record.message);
        expect(result.timestamp).to.equal(record.timestamp);
      });
    });
  });

  describe("Logger", () => {
    describe("ctor", () => {
      it("creates a new Logger using defaults", () => {
        const result = new Logger();
        expect(result.level).to.equal(Level.INFO);
        expect(result.started).to.deep.equal(now);
        expect(result.output).to.equal(Deno.stderr);
      });
      it("creates a new Logger with explicit level", () => {
        const result = new Logger(Level.ALL);
        expect(result.level).to.equal(Level.ALL);
        expect(result.started).to.deep.equal(now);
        expect(result.output).to.equal(Deno.stderr);
      });
      it("creates a new Logger with explicit starting date", () => {
        const ts = new Date();
        const result = new Logger(undefined, ts);
        expect(result.level).to.equal(Level.INFO);
        expect(result.started).to.equal(ts);
        expect(result.output).to.equal(Deno.stderr);
      });
      it("creates a new Logger with explicit output", () => {
        const result = new Logger(undefined, undefined, Deno.stdout);
        expect(result.level).to.equal(Level.INFO);
        expect(result.started).to.deep.equal(now);
        expect(result.output).to.equal(Deno.stdout);
      });
    });
    describe("get/set level", () => {
      it("sets the level", () => {
        const logger = new Logger();
        expect(logger.level).to.equal(Level.INFO);
        logger.level = Level.ALL;
        expect(logger.level).to.equal(Level.ALL);
        logger.level = Level.INFO;
        expect(logger.level).to.equal(Level.INFO);
        logger.level = Level.ERROR;
        expect(logger.level).to.equal(Level.ERROR);
        logger.level = Level.NONE;
        expect(logger.level).to.equal(Level.NONE);
      });
    });
    describe(".log()", () => {
      let logger: Logger;
      let handleSpy: sinon.SinonStub;

      beforeEach(() => {
        logger = new Logger();
        // deno-lint-ignore no-explicit-any
        handleSpy = sinon.stub(logger as any, "handle");
      });

      it("does not log if level is too 'low'", () => {
        logger.log(Level.DEBUG, "some log message");
        expect(handleSpy).to.have.callCount(0);
      });
      it("logs a message", () => {
        logger.log(Level.INFO, "some info message");
        expect(handleSpy).to.have.callCount(1);
        expect(handleSpy).to.be.deep.calledWith(new LogRecord(
          Level.INFO,
          "some info message",
          now,
        ));
      });
      it("logs a LogRecord", () => {
        const record = new LogRecord(Level.DEBUG, "some debug message");
        logger.log(Level.INFO, record);
        expect(handleSpy).to.have.callCount(1);
        expect(handleSpy).to.be.deep.calledWith(record.withLevel(Level.INFO));
      });
    });

    describe(".<level> log methods", () => {
      let output: io.StringWriter;
      let logger: Logger;
      let logSpy: sinon.SinonSpy;

      beforeEach(() => {
        output = new io.StringWriter();
        logger = new Logger(Level.ALL, undefined, output);
        logSpy = sinon.spy(logger, "log");
      });

      it("logs a TRACE message", () => {
        logger.trace("some trace message");
        expect(logSpy).to.have.callCount(1);
        expect(logSpy).to.be.deep.calledWith(Level.TRACE, "some trace message");
        expect(output.toString()).to.equal(
          fmt.dim("0ms TRACE - some trace message") + "\n",
        )
      });
      it("logs a DEBUG message", () => {
        logger.debug("some debug message");
        expect(logSpy).to.have.callCount(1);
        expect(logSpy).to.be.deep.calledWith(Level.DEBUG, "some debug message");
        expect(output.toString()).to.equal(
          fmt.dim("0ms DEBUG - some debug message") + "\n",
        )
      });
      it("logs a INFO message", () => {
        logger.info("some info message");
        expect(logSpy).to.have.callCount(1);
        expect(logSpy).to.be.deep.calledWith(Level.INFO, "some info message");
        expect(output.toString()).to.equal(
          fmt.blue("0ms INFO - some info message") + "\n",
        )
      });
      it("logs a WARNING message", () => {
        logger.warning("some warning message");
        expect(logSpy).to.have.callCount(1);
        expect(logSpy).to.be.deep.calledWith(Level.WARNING, "some warning message");
        expect(output.toString()).to.equal(
          fmt.yellow("0ms WARNING - some warning message") + "\n",
        )
      });
      it("logs a ERROR message", () => {
        logger.error("some error message");
        expect(logSpy).to.have.callCount(1);
        expect(logSpy).to.be.deep.calledWith(Level.ERROR, "some error message");
        expect(output.toString()).to.equal(
          fmt.red("0ms ERROR - some error message") + "\n",
        )
      });
      it("logs a CRITICAL message", () => {
        logger.critical("some critical message");
        expect(logSpy).to.have.callCount(1);
        expect(logSpy).to.be.deep.calledWith(Level.CRITICAL, "some critical message");
        expect(output.toString()).to.equal(
          fmt.bold(fmt.red("0ms CRITICAL - some critical message")) + "\n",
        )
      });
    });
  });

  describe("getLogger()/setLogger()", () => {
    it("returns the set Logger", () => {
      const logger = new Logger();
      setLogger(logger);
      expect(getLogger()).to.equal(logger);
    });
    it("returns the same set logger each time", () => {
      const logger = new Logger();
      setLogger(logger);
      expect(getLogger()).to.equal(logger);
      expect(getLogger()).to.equal(logger);
      expect(getLogger()).to.equal(logger);
    });
    it("returns a default logger when unset", () => {
      setLogger(undefined);
      const result = getLogger();
      expect(result.level).to.equal(Level.INFO);
      expect(result.started).to.deep.equal(now);
      expect(result.output).to.equal(Deno.stderr);
    });
  });

  describe("louder()/softer()", () => {
    beforeEach(() => {
      setLogger();
    });

    // NOTE: default logger starts at Level.INFO
    it("increments one level lower on louder()", () => {
      const result = louder();
      expect(result).to.equal(Level.DEBUG);
      expect(getLogger().level).to.equal(Level.DEBUG);
    });
    it("stops incrementing when at ALL", () => {
      getLogger().level = Level.ALL;
      const result = louder();
      expect(result).to.equal(Level.ALL);
      expect(getLogger().level).to.equal(Level.ALL);
    });
    it("increments one level higher on softer()", () => {
      const result = softer();
      expect(result).to.equal(Level.WARNING);
      expect(getLogger().level).to.equal(Level.WARNING);
    });
    it("stop incrementing softer when at NONE", () => {
      getLogger().level = Level.NONE;
      const result = softer();
      expect(result).to.equal(Level.NONE);
      expect(getLogger().level).to.equal(Level.NONE);
    });
  });

  describe("default log methods", () => {
    let logger: Logger;
    let logStub: sinon.SinonStub;

    beforeEach(() => {
      logger = new Logger(Level.ALL);
      logStub = sinon.stub(logger, "log");
      setLogger(logger);
    });

    it("logs a trace message", () => {
      logging.trace("some trace message");
      expect(logStub).to.have.callCount(1);
      expect(logStub).to.have.been.calledWith(Level.TRACE, "some trace message");
    });
    it("logs a debug message", () => {
      logging.debug("some debug message");
      expect(logStub).to.have.callCount(1);
      expect(logStub).to.have.been.calledWith(Level.DEBUG, "some debug message");
    });
    it("logs an info message", () => {
      logging.info("some info message");
      expect(logStub).to.have.callCount(1);
      expect(logStub).to.have.been.calledWith(Level.INFO, "some info message");
    });
    it("logs a warning message", () => {
      logging.warning("some warning message");
      expect(logStub).to.have.callCount(1);
      expect(logStub).to.have.been.calledWith(Level.WARNING, "some warning message");
    });
    it("logs an error message", () => {
      logging.error("some error message");
      expect(logStub).to.have.callCount(1);
      expect(logStub).to.have.been.calledWith(Level.ERROR, "some error message");
    });
    it("logs a critical message", () => {
      logging.critical("some critical message");
      expect(logStub).to.have.callCount(1);
      expect(logStub).to.have.been.calledWith(Level.CRITICAL, "some critical message");
    });
  });
});
