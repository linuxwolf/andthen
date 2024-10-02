/** */

import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { expect, mock } from "../../setup.ts";

import { stringify } from "@std/yaml";
import { _internals, Loader } from "../../../src/core/project/loader.ts";
import errors from "../../../src/util/errors.ts";

describe("core/project/loader", () => {
  let spyReadTextFile: mock.Spy;

  beforeEach(() => {
    spyReadTextFile = mock.stub(
      Deno,
      "readTextFile",
      (path: string | URL, _opts: Deno.ReadFileOptions | undefined) => {
        if (path instanceof URL) {
          path = path.pathname;
        }

        let result: string | undefined;
        switch (path) {
          case "/src/root/andthen.yaml":
            result = stringify({
              root: true,
              tasks: {
                ":build": {
                  desc: "builds root project",
                },
              },
            });
            break;
          case "/src/root/sub-a/andthen.yml":
            result = stringify({
              tasks: {
                ":build": {
                  desc: "builds sub-a project",
                },
              },
            });
            break;
          case "/src/root/sub-a/non-project/sub-sub-sub-a/andthen.yml":
            result = stringify({
              tasks: {
                ":build": {
                  desc: "builds sub-sub-sub-a project",
                },
              },
            });
            break;
          case "/src/root/sub-a/subsub-a/andthen.yaml":
            result = stringify({
              tasks: {
                ":build": {
                  desc: "builds subsub-a of sub-a project",
                },
              },
            });
            break;
          case "/src/root/sub-a/subsub-b/andthen.yaml":
            result = stringify({
              tasks: {
                ":build": {
                  desc: "builds subsub-b of sub-a project",
                },
              },
            });
            break;
          case "/src/root/sub-b/.andthen.yaml":
            result = stringify({
              tasks: {
                ":build": {
                  desc: "builds sub-b project",
                },
              },
            });
            break;
          case "/src/root/sub-c/.andthen.yml":
            result = stringify({
              tasks: {
                ":build": {
                  desc: "builds sub-c project",
                },
              },
            });
            break;
          case "/src/no-root/andthen.yaml":
            result = stringify({
              tasks: {
                ":build": {
                  desc: "builds non-root project",
                },
              },
            });
            break;
        }

        if (result === undefined) {
          throw new Deno.errors.NotFound();
        }

        return Promise.resolve(result);
      },
    );
  });

  afterEach(() => {
    spyReadTextFile.restore();
  });

  describe("_internals.loadConfig()", () => {
    const loadConfig = _internals.loadConfig;
    it("loads from root (andthen.yaml)", async () => {
      const result = await loadConfig("/src/root");
      expect(result).to.deep.equal({
        path: "/src/root",
        root: true,
        tasks: {
          ":build": {
            name: ":build",
            desc: "builds root project",
            internal: false,
          },
        },
      });
    });
    it("loads from sub-a (andthen.yml)", async () => {
      const result = await loadConfig("/src/root/sub-a");
      expect(result).to.deep.equal({
        path: "/src/root/sub-a",
        root: false,
        tasks: {
          ":build": {
            name: ":build",
            desc: "builds sub-a project",
            internal: false,
          },
        },
      });
    });
    it("loads from sub-b (.andthen.yaml)", async () => {
      const result = await loadConfig("/src/root/sub-b");
      expect(result).to.deep.equal({
        path: "/src/root/sub-b",
        root: false,
        tasks: {
          ":build": {
            name: ":build",
            desc: "builds sub-b project",
            internal: false,
          },
        },
      });
    });
    it("loads from sub-c (.andthen.yml)", async () => {
      const result = await loadConfig("/src/root/sub-c");
      expect(result).to.deep.equal({
        path: "/src/root/sub-c",
        root: false,
        tasks: {
          ":build": {
            name: ":build",
            desc: "builds sub-c project",
            internal: false,
          },
        },
      });
    });
    it("returns undefined if no candidates found", async () => {
      const result = await loadConfig("/some/nonexistent/path");
      expect(result).to.be.undefined();
    });
  });

  describe("class Loader", () => {
    describe("static .create()", () => {
      it("creates from the project root", async () => {
        const result = await Loader.create("/src/root");
        expect(result.workingDirectory).to.equal("/src/root");
        expect(result.rootDirectory).to.equal("/src/root");
        expect(result.projectPaths).to.deep.equal([
          "//",
        ]);
        expect(result.rootProject).to.deep.equal({
          parent: undefined,
          path: "//",
          root: true,
          tasks: {
            ":build": {
              name: ":build",
              desc: "builds root project",
              internal: false,
            },
          },
        });
      });
      it("creates from a sub-project", async () => {
        const result = await Loader.create("/src/root/sub-a");
        expect(result.workingDirectory).to.equal("/src/root/sub-a");
        expect(result.rootDirectory).to.equal("/src/root");
        expect(result.projectPaths).to.deep.equal([
          "//",
          "//sub-a",
        ]);
        expect(result.rootProject).to.deep.equal({
          parent: undefined,
          path: "//",
          root: true,
          tasks: {
            ":build": {
              name: ":build",
              desc: "builds root project",
              internal: false,
            },
          },
        });
      });
      it("creates from a sub-sub-project", async () => {
        const result = await Loader.create("/src/root/sub-a/subsub-a");
        expect(result.workingDirectory).to.equal("/src/root/sub-a/subsub-a");
        expect(result.rootDirectory).to.equal("/src/root");
        expect(result.projectPaths).to.deep.equal([
          "//",
          "//sub-a",
          "//sub-a/subsub-a",
        ]);
        expect(result.rootProject).to.deep.equal({
          parent: undefined,
          path: "//",
          root: true,
          tasks: {
            ":build": {
              name: ":build",
              desc: "builds root project",
              internal: false,
            },
          },
        });
      });
      it("creates from a non-subproject directory", async () => {
        const result = await Loader.create("/src/root/sub-a/subsub-c");
        expect(result.workingDirectory).to.equal("/src/root/sub-a/subsub-c");
        expect(result.rootDirectory).to.equal("/src/root");
        expect(result.projectPaths).to.deep.equal([
          "//",
          "//sub-a",
        ]);
        expect(result.rootProject).to.deep.equal({
          parent: undefined,
          path: "//",
          root: true,
          tasks: {
            ":build": {
              name: ":build",
              desc: "builds root project",
              internal: false,
            },
          },
        });
      });
      it("creates from a non-root directory", async () => {
        const result = await Loader.create("/src/no-root");
        expect(result.workingDirectory).to.equal("/src/no-root");
        expect(result.rootDirectory).to.equal("/src/no-root");
        expect(result.projectPaths).to.deep.equal([
          "//",
        ]);
        expect(result.rootProject).to.deep.equal({
          parent: undefined,
          path: "//",
          root: true,
          tasks: {
            ":build": {
              name: ":build",
              desc: "builds non-root project",
              internal: false,
            },
          },
        });
      });
      it("throws on no root configuration found", async () => {
        const err = (await expect(Loader.create("/path/without/project")).to.be
          .rejectedWith(errors.ConfigNotFound)).actual;
        expect(err.path).to.equal("/path/without/project");
        expect(err.message).startsWith("no root configuration found");
      });
    });

    describe(".open()", () => {
      let spyLoadConfig: mock.Spy;
      let loader: Loader;

      beforeEach(async () => {
        loader = await Loader.create("//src/root/sub-a/subsub-a");
        spyLoadConfig = mock.spy(_internals, "loadConfig");
      });
      afterEach(() => {
        spyLoadConfig.restore();
      });

      it("opens a fresh project", async () => {
        const result = await loader.open("//sub-b");
        expect(result).to.deep.equal({
          parent: "//",
          path: "//sub-b",
          root: false,
          tasks: {
            ":build": {
              name: ":build",
              desc: "builds sub-b project",
              internal: false,
            },
          },
        });
        expect(spyLoadConfig).to.have.been.called(1);
      });
      it("opens a fresh sub-project", async () => {
        const result = await loader.open("//sub-a/subsub-b");
        expect(result).to.deep.equal({
          parent: "//sub-a",
          path: "//sub-a/subsub-b",
          root: false,
          tasks: {
            ":build": {
              name: ":build",
              desc: "builds subsub-b of sub-a project",
              internal: false,
            },
          },
        });
        expect(spyLoadConfig).to.have.been.called(1);
      });

      it("opens a sub-sub project with no sub-project", async () => {
        const result = await loader.open("//sub-a/non-project/sub-sub-sub-a");
        expect(result).to.deep.equal({
          parent: "//sub-a",
          path: "//sub-a/non-project/sub-sub-sub-a",
          root: false,
          tasks: {
            ":build": {
              name: ":build",
              desc: "builds sub-sub-sub-a project",
              internal: false,
            },
          },
        });
      });

      it("opens a cached project", async () => {
        const result = await loader.open("//sub-a");
        expect(result).to.deep.equal({
          parent: "//",
          path: "//sub-a",
          root: false,
          tasks: {
            ":build": {
              name: ":build",
              desc: "builds sub-a project",
              internal: false,
            },
          },
        });
        expect(spyLoadConfig).to.have.not.been.called();
      });

      it("fails if no project found", async () => {
        const err =
          (await expect(loader.open("//no-project")).to.be.rejectedWith(
            errors.ConfigNotFound,
          )).actual;
        expect(err.path).to.equal("//no-project");
      });
    });
  });
});
