/** */

import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";

import { stringify } from "@std/yaml";
import { _internals } from "../../../src/core/project/loader.ts";
import { expect, mock } from "../../setup.ts";
import errors from "../../../src/util/errors.ts";

describe("core/project/loader", () => {
  describe("load()", () => {
    const load = _internals.load;
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

    it("loads from root (andthen.yaml)", async () => {
      const result = await load("/src/root");
      expect(result).to.deep.equal({
        path: "/src/root",
        root: true,
        tasks: {
          "/src/root:build": {
            name: ":build",
            desc: "builds root project",
            internal: false,
          },
        },
      });
    });
    it("loads from sub-a (andthen.yml)", async () => {
      const result = await load("/src/root/sub-a");
      expect(result).to.deep.equal({
        path: "/src/root/sub-a",
        root: false,
        tasks: {
          "/src/root/sub-a:build": {
            name: ":build",
            desc: "builds sub-a project",
            internal: false,
          },
        },
      });
    });
    it("loads from sub-b (.andthen.yaml)", async () => {
      const result = await load("/src/root/sub-b");
      expect(result).to.deep.equal({
        path: "/src/root/sub-b",
        root: false,
        tasks: {
          "/src/root/sub-b:build": {
            name: ":build",
            desc: "builds sub-b project",
            internal: false,
          },
        },
      });
    });
    it("loads from sub-c (.andthen.yml)", async () => {
      const result = await load("/src/root/sub-c");
      expect(result).to.deep.equal({
        path: "/src/root/sub-c",
        root: false,
        tasks: {
          "/src/root/sub-c:build": {
            name: ":build",
            desc: "builds sub-c project",
            internal: false,
          },
        },
      });
    });
    it("fails if no candidates found", async () => {
      const err =
        (await expect(load("/some/nonexistent/path")).to.be.rejectedWith(
          errors.ConfigNotFound,
        )).actual;
      expect(err.path).to.equal("/some/nonexistent/path");
    });
  });
});
