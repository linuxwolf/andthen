import { afterEach, beforeEach, describe, expect, it, sinon } from "../deps.ts";

import { ProjectBuilder } from "../../src/core/project.ts";
import { Parser } from "../../src/parser/yaml.ts";
import * as errors from "../../src/errors/mod.ts";
import { TargetBuilder } from "../../src/core/target.ts";

describe("parser/yaml", () => {
  describe("Parser", () => {
    describe("findConfig()", () => {
      let parser: Parser;
      let stubStat: sinon.SinonStub;

      beforeEach(() => {
        stubStat = sinon.stub(Deno, "stat");
        stubStat.rejects(new Deno.errors.NotFound());
      });
      afterEach(() => {
        stubStat.restore();
      });

      describe(".yaml files", () => {
        beforeEach(() => {
          parser = new Parser();

          stubStat.withArgs("project").resolves({
            isDirectory: true,
          });
          stubStat.withArgs("project/andthen.yaml").resolves({
            isFile: true,
          });

          stubStat.withArgs(".").resolves({
            isDirectory: true,
          });
          stubStat.withArgs("andthen.yaml").resolves({
            isFile: true,
          });

          stubStat.withArgs("..").resolves({
            isDirectory: true,
          });
          stubStat.withArgs("../andthen.yaml").resolves({
            isFile: true,
          });
        });

        it("succeeds with a supported file", async () => {
          const result = await parser.findConfig("andthen.yaml");
          expect(result?.basepath).to.equal(".");
          expect(result?.configpath).to.equal("andthen.yaml");
        });
        it("succeeds on implicit with .yaml", async () => {
          const result = await parser.findConfig("project");
          expect(result?.basepath).to.equal("project");
          expect(result?.configpath).to.equal("project/andthen.yaml");
        });
        it("succeeds with a relative parent directory with implicit .yml", async () => {
          const result = await parser.findConfig(".");
          expect(result?.basepath).to.equal(".");
          expect(result?.configpath).to.equal("andthen.yaml");
        });
        it("succeeds with a relative ancestor directory with implicit .yml", async () => {
          const result = await parser.findConfig("..");
          expect(result?.basepath).to.equal("..");
          expect(result?.configpath).to.equal("../andthen.yaml");
        });
      });
      describe(".yml files", () => {
        beforeEach(() => {
          parser = new Parser();

          stubStat.withArgs("project").resolves({
            isDirectory: true,
          });
          stubStat.withArgs("project/andthen.yml").resolves({
            isFile: true,
          });

          stubStat.withArgs(".").resolves({
            isDirectory: true,
          });
          stubStat.withArgs("andthen.yml").resolves({
            isFile: true,
          });

          stubStat.withArgs("..").resolves({
            isDirectory: true,
          });
          stubStat.withArgs("../andthen.yml").resolves({
            isFile: true,
          });
        });

        it("succeeds with a supported file", async () => {
          const result = await parser.findConfig("andthen.yml");
          expect(result?.basepath).to.equal(".");
          expect(result?.configpath).to.equal("andthen.yml");
        });
        it("succeeds on implicit with .yml", async () => {
          const result = await parser.findConfig("project");
          expect(result?.basepath).to.equal("project");
          expect(result?.configpath).to.equal("project/andthen.yml");
        });
        it("succeeds with a relative parent directory with implicit .yml", async () => {
          const result = await parser.findConfig(".");
          expect(result?.basepath).to.equal(".");
          expect(result?.configpath).to.equal("andthen.yml");
        });
        it("succeeds with a relative ancestor directory with implicit .yml", async () => {
          const result = await parser.findConfig("..");
          expect(result?.basepath).to.equal("..");
          expect(result?.configpath).to.equal("../andthen.yml");
        });
      });

      describe("failure modes", () => {
        it("fails if path is not a regular file or directory", async () => {
          stubStat.resolves({
            isFile: false,
            isDirectory: false,
          });

          await expect(parser.findConfig("project/stdout"))
            .to.be.rejectedWith(errors.InvalidFile)
            .eventually.with.property("filepath", "project/stdout");
        });
        it("fails if file doesn't match expected name", async () => {
          stubStat.resolves({
            isFile: true,
          });

          await expect(parser.findConfig("project/something.yaml"))
            .to.be.rejectedWith(errors.InvalidFile)
            .eventually.with.property("filepath", "project/something.yaml");
        });
        it("fails if no config file found", async () => {
          stubStat.withArgs("project").resolves({
            isDirectory: true,
          });

          await expect(parser.findConfig("project"))
            .to.be.rejectedWith(errors.ConfigMissing)
            .eventually.with.property("filepath", "project");
        });
        it("fails if directory does not exist", async () => {
          await expect(parser.findConfig("project"))
            .to.be.rejectedWith(errors.ConfigMissing)
            .eventually.with.property("filepath", "project");
        });
      });
    });

    describe("load", () => {
      const config = {
        basepath: "project",
        configpath: "project/andthen.yaml",
      };
      let parser: Parser;
      let stubFindConfig: sinon.SinonStub;
      let stubReadTextFile: sinon.SinonStub;

      beforeEach(() => {
        parser = new Parser();

        stubFindConfig = sinon.stub(parser, "findConfig");
        stubFindConfig.resolves(config);

        stubReadTextFile = sinon.stub(Deno, "readTextFile");
        stubReadTextFile.rejects(new Deno.errors.PermissionDenied());
      });

      afterEach(() => {
        stubFindConfig.restore();
        stubReadTextFile.restore();
      });

      it("parses an empty file", async () => {
        stubReadTextFile.resolves("");

        const result = await parser.load(config.basepath);
        expect(result).to.deep.equal(new ProjectBuilder(config.basepath));
      });
      describe("`root`", () => {
        it("parses a minimal 'root' project", async () => {
          stubReadTextFile.resolves("root: true");
          const builder = new ProjectBuilder(config.basepath)
            .asRoot();

          const result = await parser.load(config.basepath);
          expect(result).to.deep.equal(builder);
        });
        it("fails if `root` is not a boolean", async () => {
          stubReadTextFile.resolves("root: something unexpected");

          await expect(parser.load(config.basepath)).to.be.rejected;
        });
      });

      describe("`default`", () => {
        it("parses a minimal `default` project", async () => {
          stubReadTextFile.resolves("default: default-target");
          const builder = new ProjectBuilder(config.basepath)
            .withDefault("default-target");

          const result = await parser.load(config.basepath);
          expect(result).to.deep.equal(builder);
        });
        it("fails if `default` is not a string", async () => {
          stubReadTextFile.resolves("default: 42");

          await expect(parser.load(config.basepath)).to.be.rejected;
        });
      });

      describe("variables", () => {
        let builder: ProjectBuilder;

        beforeEach(() => {
          builder = new ProjectBuilder(config.basepath)
            .withVariable("FOO", "foo value")
            .withVariable("BAR", "bar value");
        });
        it("parsers project `variables`", async () => {
          stubReadTextFile.resolves(`
variables:
  FOO: foo value
  BAR: bar value
`);
          const result = await parser.load(config.basepath);
          expect(result).to.deep.equal(builder);
        });
        it("parsers project `vars`", async () => {
          stubReadTextFile.resolves(`
vars:
  FOO: foo value
  BAR: bar value
`);
          const result = await parser.load(config.basepath);
          expect(result).to.deep.equal(builder);
        });
      });

      describe("targets", () => {
        let builder: ProjectBuilder;

        beforeEach(() => {
          builder = new ProjectBuilder(config.basepath);
        });
        it("fails if target has no name", async () => {
          stubReadTextFile.resolves(`
targets:
 - desc: a bad target
`);
          await expect(parser.load(config.basepath)).to.be.rejected;
        });
        it("parses a minimal target", async () => {
          builder.withTarget(
            new TargetBuilder("test-target"),
          );
          stubReadTextFile.resolves(`
targets:
  - name: test-target
`);

          const result = await parser.load(config.basepath);
          expect(result.targets).to.deep.equal(builder.targets);
        });
        describe("with description", () => {
          beforeEach(() => {
            const target = new TargetBuilder("test-target")
              .withDescription("a test target");
            builder.withTarget(target);
          });
          it("parses a simple `desc` target", async () => {
            stubReadTextFile.resolves(`
targets:
  - name: test-target
    desc: a test target
`);
            const result = await parser.load(config.basepath);
            expect(result).to.deep.equal(builder);
          });
          it("parses a simple `description` target", async () => {
            stubReadTextFile.resolves(`
targets:
  - name: test-target
    description: a test target
`);
            const result = await parser.load(config.basepath);
            expect(result).to.deep.equal(builder);
          });
        });
        describe("with action", () => {
          beforeEach(() => {
            builder.withTarget(
              new TargetBuilder("test-target")
                .withAction("echo test"),
            );
          });
          it("parses a simple `act` target", async () => {
            stubReadTextFile.resolves(`
  targets:
    - name: test-target
      act: echo test
  `);

            const result = await parser.load(config.basepath);
            expect(result).to.deep.equal(builder);
          });
          it("parses a simple `action` target", async () => {
            stubReadTextFile.resolves(`
  targets:
    - name: test-target
      action: echo test
  `);

            const result = await parser.load(config.basepath);
            expect(result.targets).to.deep.equal(builder.targets);
          });
        });
        describe("with output", () => {
          beforeEach(() => {
            const target = new TargetBuilder("test-target")
              .withOutput("OUTPUT_VAR");
            builder.withTarget(target);
          });
          it("parses a target `out`", async () => {
            stubReadTextFile.resolves(`
  targets:
    - name: test-target
      out: OUTPUT_VAR
  `);

            const result = await parser.load(config.basepath);
            expect(result.targets).to.deep.equal(builder.targets);
          });
          it("parses a target `output`", async () => {
            stubReadTextFile.resolves(`
  targets:
    - name: test-target
      output: OUTPUT_VAR
  `);

            const result = await parser.load(config.basepath);
            expect(result.targets).to.deep.equal(builder.targets);
          });
        });
        describe("with dependencies", () => {
          beforeEach(() => {
            const target = new TargetBuilder("test-target")
              .dependsOn("target-a", "target-b");
            builder.withTarget(target);
          });
          it("parses a target's `deps`", async () => {
            stubReadTextFile.resolves(`
targets:
  - name: test-target
    deps:
      - target-a
      - target-b
`);
            const result = await parser.load(config.basepath);
            expect(result).to.deep.equal(result);
          });
          it("parses a target's `dependencies`", async () => {
            stubReadTextFile.resolves(`
targets:
  - name: test-target
    dependencies:
      - target-a
      - target-b
`);
            const result = await parser.load(config.basepath);
            expect(result).to.deep.equal(result);
          });
        });
        describe("with variables", () => {
          beforeEach(() => {
            const target = new TargetBuilder("test-target")
              .withVariable("FOO", "target foo value")
              .withVariable("BAR", "target bar value");
            builder.withTarget(target);
          });
          it("parses a target `vars`", async () => {
            stubReadTextFile.resolves(`
targets:
  - name:  test-target
    vars:
      FOO: target foo value
      BAR: target bar value
`);
            const result = await parser.load(config.basepath);
            expect(result).to.deep.equal(builder);
          });
          it("parses a target `variables`", async () => {
            stubReadTextFile.resolves(`
targets:
  - name:  test-target
    variables:
      FOO: target foo value
      BAR: target bar value
`);
            const result = await parser.load(config.basepath);
            expect(result).to.deep.equal(builder);
          });
        });
      });
    });
  });
});
