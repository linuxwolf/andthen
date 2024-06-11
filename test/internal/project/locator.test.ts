import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { expect, mock } from "../../setup.ts";

import { stringify } from "@std/yaml";
import {
  _internals,
  locate,
  Locator,
} from "../../../src/internal/project/locator.ts";

const BASE_YAML = {
  tasks: {
    ":build": {},
    ":test": {},
    ":doc": {},
  },
};

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

describe("internal/locator", () => {
  let spyReadTextFile: mock.Spy;

  beforeEach(() => {
    spyReadTextFile = mock.stub(_internals, "readTextFile", stubReadTextFile);
  });

  afterEach(() => {
    spyReadTextFile.restore();
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
          ":build": {},
          ":test": {},
          ":doc": {},
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
          ":build": {},
          ":test": {},
          ":doc": {},
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
          ":build": {},
          ":test": {},
          ":doc": {},
        },
      });
    });

    it("return undefined when not found", async () => {
      const result = await locate("/app/project");
      expect(result).to.be.undefined();
    });
  });

  describe("Locator", () => {
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
        const err = (await expect(locator.init()).to.be.rejected()).actual;
        expect(err.message).to.equal("no root found");
      });
    });
  });
});
