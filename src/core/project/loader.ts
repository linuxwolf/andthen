/** */

import { dirname, join } from "@std/path";
import { parse as parseYaml } from "@std/yaml";

import errors from "../../util/errors.ts";
import logger from "../../util/logging.ts";
import type { InternalsBase } from "../../util/types.ts";
import {
  type Config as ProjectConfig,
  from as parseProject,
} from "./config.ts";

const log = logger("loader", "project");

interface Internals extends InternalsBase {
  loadConfig: (path: string) => Promise<ProjectConfig | undefined>;
}
export const _internals: Internals = {
  loadConfig,
};

const CANDIDATES = [
  "andthen.yaml",
  "andthen.yml",
  ".andthen.yaml",
  ".andthen.yml",
];

async function loadConfig(path: string): Promise<ProjectConfig | undefined> {
  for (const check of CANDIDATES) {
    const abs = join(path, check);
    try {
      const text = await Deno.readTextFile(abs);
      const data = parseYaml(text, { schema: "core" });
      const config = parseProject(path, data);

      return config;
    } catch (err) {
      log.debug`could not load from ${abs}: ${err.message}`;
    }
  }

  return undefined;
}

function reparent(cache: Record<string, ProjectConfig>, rootDir: string) {
  // assumes the following:
  // 1. all keys are absolute paths
  // 2. once sorted by key, next is a child of previous

  const result: Record<string, ProjectConfig> = {};
  let parent: string | undefined;
  for (const key of Object.keys(cache).sort()) {
    const path = "//" + key.substring(rootDir.length + 1);
    const root = path === "//";
    const config = {
      ...cache[key],
      path,
      parent,
      root,
    };
    result[path] = config;
    parent = config.path;
  }

  return result;
}

export class Loader {
  #workingDirectory: string;
  #rootDirectory: string = "/";
  #cache: Record<string, ProjectConfig>;

  private constructor(
    workingDirectory: string,
    rootDirectory: string,
    cache: Record<string, ProjectConfig>,
  ) {
    this.#workingDirectory = workingDirectory;
    this.#rootDirectory = rootDirectory;
    this.#cache = { ...cache };
  }

  get workingDirectory() {
    return this.#workingDirectory;
  }

  get rootDirectory() {
    return this.#rootDirectory;
  }
  get rootProject() {
    return this.#cache["//"];
  }

  get projectPaths() {
    return Object.keys(this.#cache).sort();
  }

  private parentPath(path: string): string {
    path = path.substring(1);
    let parent: ProjectConfig | undefined;
    while (!parent) {
      path = dirname(path);
      if (path === "/") {
        parent = this.rootProject;
      } else {
        parent = this.#cache["/" + path];
      }
    }

    return parent!.path;
  }

  async open(path: string): Promise<ProjectConfig | undefined> {
    // {path} is rooted ("//")
    if (!path.startsWith("//")) {
      throw new errors.InvalidArgument("path", path);
    }

    // check cache
    let config: ProjectConfig | undefined = this.#cache[path];
    if (config) {
      return config;
    }

    // locate directly
    const dir = join(this.rootDirectory, path.substring(2));
    config = await _internals.loadConfig(dir);
    if (!config) {
      throw new errors.ConfigNotFound(path);
    }

    // find parent
    const parent = this.parentPath(path);
    const result = {
      ...config,
      path,
      parent,
    };
    this.#cache[path] = result;

    return result;
  }

  static async create(cwd: string): Promise<Loader> {
    // {cwd} is an absolute path
    let cache: Record<string, ProjectConfig> = {};

    // find root project
    let current: ProjectConfig | undefined;
    let root: ProjectConfig | undefined;
    let dir = cwd;
    do {
      log.debug`search for configuration from ${dir} ...`;
      let curr = dir;
      root = current;

      // locate a config
      do {
        current = await _internals.loadConfig(curr);
        curr = dirname(curr);
      } while (!current && curr !== "/");

      if (current) {
        log.debug`... configuration found in ${dir}`;
        // cache by abs path (for now)
        cache[current.path] = current;
      }

      // prep for parent
      dir = curr;
    } while (current && !current.root);

    if (current?.root) {
      root = current;
      log.debug`root is ${root.path}`;
    }
    if (!root) {
      throw new errors.ConfigNotFound(cwd, "no root configuration found");
    }

    // fixup
    const rootDir = root.path;
    cache = reparent(cache, rootDir);

    return new Loader(cwd, rootDir, cache);
  }
}
