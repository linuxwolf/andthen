/** */

import { afterEach, beforeEach, describe, it } from "deno_std/testing/bdd.ts";
import { expect, mock } from "./mocking.ts";

import { ConfigNotFound, MalformedConfig } from "../src/errors.ts";
import { _internals, load } from "../src/loader.ts";

describe("loader", () => {
  describe("_internals", () => {
    describe("loadContent()", () => {
      it("loads YAML as a ProjectConfig", () => {
        const content = `
  desc: sample project

  tasks:
    build:
      - echo do something
      - echo do some more
    test:
      steps:
        - type: shell
          cmd: echo do some tests
  `;
        const result = _internals.loadContent("my-project", content);
        expect(result).to.deep.equal({
          path: "my-project",
          desc: "sample project",
          tasks: [
            {
              name: "build",
              steps: [
                { type: "shell", cmd: "echo do something" },
                { type: "shell", cmd: "echo do some more" },
              ],
            },
            {
              name: "test",
              steps: [
                { type: "shell", cmd: "echo do some tests" },
              ],
            },
          ],
        });
      });
      it("throws on bad config", () => {
        const content = `
desc: true
root: "my-project"

task:
  build:
    - echo do the build
`;
        expect(() => _internals.loadContent("my-project", content)).to.throw();
      });
    });

    describe("locateConfig()", () => {
      let readTextFileStub: mock.Stub | undefined = undefined;

      afterEach(() => {
        readTextFileStub && readTextFileStub.restore();
        readTextFileStub = undefined;
      });

      for (const config of _internals.CONFIG_FILES) {
        it(`read from the config "${config}"`, async () => {
          readTextFileStub = mock.stub(
            Deno,
            "readTextFile",
            (path: string | URL) => {
              if (path.toString().endsWith(config)) {
                return Promise.resolve("config content");
              }
              throw new Deno.errors.NotFound();
            },
          );

          const result = await _internals.locateConfig("some/path");
          expect(result).to.equal("config content");
          expect(readTextFileStub).to.have.been.calledWith([
            `some/path/${config}`,
          ]);
        });
      }

      it("return undefined for no matches", async () => {
        readTextFileStub = mock.stub(Deno, "readTextFile", () => {
          throw new Deno.errors.NotFound();
        });

        const result = await _internals.locateConfig("some/path");
        expect(result).to.be.undefined();
      });
    });
  });
  describe("load()", () => {
    const content = `
desc: sample project

tasks:
  build:
    - echo do something
    - echo do some more
  test:
    steps:
      - type: shell
        cmd: echo do some tests
`;

    let locateConfigStub: mock.Stub | undefined = undefined;
    let loadContentSpy: mock.Spy | undefined = undefined;

    afterEach(() => {
      locateConfigStub && !locateConfigStub.restored &&
        locateConfigStub.restore();
      loadContentSpy && !loadContentSpy.restored && loadContentSpy.restore();
    });

    it("returns a ProjectConfig for a resolved path", async () => {
      locateConfigStub = mock.stub(
        _internals,
        "locateConfig",
        () => Promise.resolve(content),
      );
      loadContentSpy = mock.spy(_internals, "loadContent");

      const result = await load("path/to/my-project");
      expect(result).to.deep.equal({
        path: "path/to/my-project",
        desc: "sample project",
        tasks: [
          {
            name: "build",
            steps: [
              { type: "shell", cmd: "echo do something" },
              { type: "shell", cmd: "echo do some more" },
            ],
          },
          {
            name: "test",
            steps: [
              { type: "shell", cmd: "echo do some tests" },
            ],
          },
        ],
      });
      expect(locateConfigStub).to.have.been.deep.calledWith([
        "path/to/my-project",
      ]);
      expect(loadContentSpy).to.have.been.deep.calledWith([
        "path/to/my-project",
        content,
      ]);
    });

    it("returns undefined if no config is located", async () => {
      locateConfigStub = mock.stub(
        _internals,
        "locateConfig",
        () => Promise.resolve(undefined),
      );

      const result = await load("path/to/my-config");
      expect(result).to.be.undefined();
    });

    it("fails if config fails parsing", async () => {
      locateConfigStub = mock.stub(
        _internals,
        "locateConfig",
        () => Promise.resolve(content),
      );
      loadContentSpy = mock.stub(_internals, "loadContent", () => {
        throw new Error("YAML parsing failed");
      });

      const err = (await expect(load("path/to/my-project")).to.be.rejectedWith(
        MalformedConfig,
      )).actual as MalformedConfig;
      expect(err.path).to.equal("path/to/my-project");
    });
  });
});
