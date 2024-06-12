import { walk } from "@std/fs";
import { dirname, join, relative } from "@std/path";
import { parse as parseYaml } from "@std/yaml";
import { parse as parseProject, ProjectConfig } from "./config.ts";
import { NotReadyError, ProjectNotFoundError } from "../errors.ts";

export const _internals = {
  readTextFile: Deno.readTextFile,
  walk,
};

const MANIFESTS = [
  "andthen.yaml",
  "andthen.yml",
  ".andthen.yaml",
  ".andthen.yml",
];

async function loadFrom(path: string) {
  for (const entry of MANIFESTS) {
    try {
      const loc = join(path, entry);
      const content = await _internals.readTextFile(loc);
      return parseYaml(content);
    } catch (_err) {
      // TODO: loggit
    }
  }

  return undefined;
}

export async function locate(path: string, exact = false) {
  let data: unknown | undefined;
  let current = path;
  let prev = current;
  let done = false;

  while (!done) {
    data = await loadFrom(current);
    prev = current;
    current = dirname(current);
    done = exact || (data !== undefined) || (current === prev);
  }

  if (data === undefined) {
    return undefined;
  }
  return parseProject(prev, data);
}

export class Locator {
  #inited = false;
  #execDir: string;
  #rootDir?: string;

  #rootProject?: ProjectConfig;
  #cache: Record<string, ProjectConfig> = {};

  constructor(execDir: string) {
    this.#execDir = execDir;
  }

  get execDir() {
    return this.#execDir;
  }

  get rootDir() {
    return this.#rootDir!;
  }

  get initialized() {
    return this.#inited;
  }

  get projectPaths() {
    return Object.keys(this.#cache).sort();
  }

  async init() {
    const root = await this.#findRoot();
    this.#rewire(root.path);

    this.#inited = true;
  }

  async walk() {
    if (!this.initialized) {
      throw new NotReadyError("locator not initialized");
    }

    for await (const entry of _internals.walk(this.rootDir)) {
      let { path } = entry;
      const config = await locate(path, true);
      if (!config) { continue; }

      path = this.#toRootPath(path);
      if (path in this.#cache) { continue; }

      this.applyConfig(path, config);
    }
  }

  applyConfig(path: string, config: ProjectConfig) {
    config = {
      ...config,
      path,
      root: (path === "//"),
    };
    this.#cache[path] = config;
  }

  #toRootPath(path: string) {
    return `//${relative(this.rootDir, path)}`;
  }

  async #findRoot() {
    let found: ProjectConfig | undefined;
    let currPath = this.#execDir;
    let prevPath = currPath;

    do {
      const config = await locate(currPath);
      if (!config) {
        break;
      }

      found = config;
      this.#cache[found.path] = config;
      prevPath = found.path;
      currPath = dirname(prevPath);
    } while (!(found?.root));

    if (!found) {
      throw new ProjectNotFoundError(this.execDir, "no root found");
    }
    return found;
  }

  #rewire(rootPath: string) {
    const cache = this.#cache;

    this.#cache = {};
    this.#rootDir = rootPath;
    for (const k of Object.keys(cache)) {
      const path = this.#toRootPath(k);
      this.applyConfig(path, cache[k]);
    }

    this.#rootProject = this.#cache["//"];
  }
}
