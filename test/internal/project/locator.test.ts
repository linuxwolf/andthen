import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { expect, mock } from "../../setup.ts";
import { join } from "@std/path";
import { WalkEntry, WalkOptions } from "@std/fs";

import { stringify } from "@std/yaml";
import {
  _internals,
  locate,
  Locator,
} from "../../../src/internal/project/locator.ts";
import {
  NotReadyError,
  ProjectNotFoundError,
} from "../../../src/internal/errors.ts";

const BASE_YAML = {
  tasks: {
    ":build": {},
    ":test": {},
    ":doc": {},
  },
};

async function* stubWalk(_path: string | URL, _opts?: WalkOptions) {
  const BASE_ENTRY: Partial<WalkEntry> = {
    isDirectory: true,
    isFile: false,
    isSymlink: false,
  };
  const BASE_DIR = "/src/root";

  yield await Promise.resolve({
    ...BASE_ENTRY,
    name: "sub-project-1",
    path: join(BASE_DIR, "sub-project-1"),
  } as WalkEntry);
  yield await Promise.resolve({
    ...BASE_ENTRY,
    name: "sub-a",
    path: join(BASE_DIR, "sub-project-1/sub-a"),
  } as WalkEntry);
  yield await Promise.resolve({
    ...BASE_ENTRY,
    name: "sub-b",
    path: join(BASE_DIR, "sub-project-1/sub-b"),
  } as WalkEntry);

  yield await Promise.resolve({
    ...BASE_ENTRY,
    name: "sub-project-2",
    path: join(BASE_DIR, "sub-project-2"),
  } as WalkEntry);
  yield await Promise.resolve({
    ...BASE_ENTRY,
    name: "sub-a",
    path: join(BASE_DIR, "sub-project-2/sub-a"),
  } as WalkEntry);
  yield await Promise.resolve({
    ...BASE_ENTRY,
    name: "sub-b",
    path: join(BASE_DIR, "sub-project-2/sub-b"),
  } as WalkEntry);
}

function stubReadTextFile(path: string | URL): Promise<string> {
  switch (path.toString()) {
    case "/src/root/andthen.yml":
      return Promise.resolve(stringify({
        root: true,
        ...BASE_YAML,
      }));
    case "/src/root/sub-project-1/andthen.yaml":
      return Promise.resolve(stringify({
        ...BASE_YAML,
      }));
    case "/src/root/sub-project-1/sub-a/.andthen.yml":
      return Promise.resolve(stringify({
        ...BASE_YAML,
      }));
    case "/src/root/sub-project-2/.andthen.yaml":
      return Promise.resolve(stringify({
        ...BASE_YAML,
      }));

    // implied root projects
    case "/src/project/andthen.yaml":
      return Promise.resolve(stringify({
        ...BASE_YAML,
      }));
    case "/src/project/sub-project-1/andthen.yaml":
      return Promise.resolve(stringify({
        ...BASE_YAML,
      }));
    case "/src/project/sub-project-1/sub-a/.andthen.yml":
      return Promise.resolve(stringify({
        ...BASE_YAML,
      }));
    case "/src/project/sub-project-2/.andthen.yaml":
      return Promise.resolve(stringify({
        ...BASE_YAML,
      }));

    default:
      return Promise.reject(new Deno.errors.NotFound());
  }
}

describe("internal/project/locator", () => {
  let spyReadTextFile: mock.Spy;
  let spyWalk: mock.Spy;

  beforeEach(() => {
    spyReadTextFile = mock.stub(_internals, "readTextFile", stubReadTextFile);
    spyWalk = mock.stub(_internals, "walk", stubWalk);
  });

  afterEach(() => {
    spyReadTextFile.restore();
    spyWalk.restore();
  });

  describe("locate()", () => {
    it("returns a non-root ProjectConfig", async () => {
      const path = "/src/root/sub-project-1";
      const result = await locate(path);
      expect(result).to.deep.equal({
        path,
        root: false,
        defaults: {
          task: ":default",
        },
        tasks: {
          ":build": {
            name: ":build",
            desc: "",
            deps: [],
          },
          ":test": {
            name: ":test",
            desc: "",
            deps: [],
          },
          ":doc": {
            name: ":doc",
            desc: "",
            deps: [],
          },
        },
      });
    });
    it("returns a root ProjectConfig", async () => {
      const path = "/src/root";
      const result = await locate(path);
      expect(result).to.deep.equal({
        path,
        root: true,
        defaults: {
          task: ":default",
        },
        tasks: {
          ":build": {
            name: ":build",
            desc: "",
            deps: [],
          },
          ":test": {
            name: ":test",
            desc: "",
            deps: [],
          },
          ":doc": {
            name: ":doc",
            desc: "",
            deps: [],
          },
        },
      });
    });
    it("returns the nearest ProjectConfig", async () => {
      const result = await locate("/src/root/sub-project-2/sub-a");
      expect(result).to.deep.equal({
        path: "/src/root/sub-project-2",
        root: false,
        defaults: {
          task: ":default",
        },
        tasks: {
          ":build": {
            name: ":build",
            desc: "",
            deps: [],
          },
          ":test": {
            name: ":test",
            desc: "",
            deps: [],
          },
          ":doc": {
            name: ":doc",
            desc: "",
            deps: [],
          },
        },
      });
    });

    it("returns undefined when not found", async () => {
      const result = await locate("/app/project");
      expect(result).to.be.undefined();
    });

    it("returns undefined when exact path has no config", async () => {
      const result = await locate("/src/root/sub-project-2/sub-a", true);
      expect(result).to.be.undefined();
    });
  });

  describe("class Locator", () => {
    describe("ctor", () => {
      it("constructs with the given execDir", () => {
        const result = new Locator("/src/root");
        expect(result.execDir).to.equal("/src/root");
        expect(result.initialized).to.be.false();
      });
    });

    describe("init()", () => {
      it("initializes from the root directory", async () => {
        const locator = new Locator("/src/root");
        await locator.init();
        expect(locator.initialized).to.be.true();
        expect(locator.rootDir).to.equal("/src/root");
        expect(locator.projectPaths).to.deep.equal(["//"]);
      });
      it("initializes from a sub-directory", async () => {
        const locator = new Locator("/src/root/sub-project-1/sub-a");
        await locator.init();
        expect(locator.initialized).to.be.true();
        expect(locator.rootDir).to.equal("/src/root");
        expect(locator.projectPaths).to.deep.equal([
          "//",
          "//sub-project-1",
          "//sub-project-1/sub-a",
        ]);
      });
      it("initializes with an implied root", async () => {
        const locator = new Locator("/src/project/sub-project-1/sub-a");
        await locator.init();
        expect(locator.initialized).to.be.true();
        expect(locator.rootDir).to.equal("/src/project");
        expect(locator.projectPaths).to.deep.equal([
          "//",
          "//sub-project-1",
          "//sub-project-1/sub-a",
        ]);
      });

      it("fails if no projects are found", async () => {
        const locator = new Locator("/src/app/project-1");
        const err = (await expect(locator.init()).to.be.rejectedWith(
          ProjectNotFoundError,
        ))
          .actual;
        expect(err.message).to.equal(
          'root project not found: ( path: "/src/app/project-1" )',
        );
        expect(err.path).to.equal("/src/app/project-1");
      });
    });

    describe("walk()", () => {
      let spyApplyConfig: mock.Spy;

      afterEach(() => {
        spyApplyConfig.restore();
      });

      async function makeLocator(path: string, init = true) {
        const result = new Locator(path);
        if (init) {
          await result.init();
        }

        spyApplyConfig = mock.spy(result, "applyConfig");
        return result;
      }

      it("fails if not initialized", async () => {
        const locator = await makeLocator("/src/root", false);
        const err =
          (await expect(locator.walk()).to.be.rejectedWith(NotReadyError))
            .actual;
        expect(err.message).to.equal("locator not initialized");
      });

      it("walks the rootDir descendants", async () => {
        const locator = await makeLocator("/src/root");
        await locator.walk();
        expect(locator.projectPaths).to.deep.equal([
          "//",
          "//sub-project-1",
          "//sub-project-1/sub-a",
          "//sub-project-2",
        ]);
        expect(spyApplyConfig.calls.length).to.equal(3);
        expect(spyApplyConfig.calls[0].args[0]).to.equal("//sub-project-1");
        expect(spyApplyConfig.calls[1].args[0]).to.equal(
          "//sub-project-1/sub-a",
        );
        expect(spyApplyConfig.calls[2].args[0]).to.equal("//sub-project-2");
      });
      it("walks the rootDir descendants, with cache hits", async () => {
        const locator = await makeLocator("/src/root/sub-project-1");
        await locator.walk();
        expect(locator.projectPaths).to.deep.equal([
          "//",
          "//sub-project-1",
          "//sub-project-1/sub-a",
          "//sub-project-2",
        ]);
        expect(spyApplyConfig.calls.length).to.equal(2);
        expect(spyApplyConfig.calls[0].args[0]).to.equal(
          "//sub-project-1/sub-a",
        );
        expect(spyApplyConfig.calls[1].args[0]).to.equal("//sub-project-2");
      });
    });
  });
});
