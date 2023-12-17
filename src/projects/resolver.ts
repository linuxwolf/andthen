/** */

import { common, dirname, join } from "deno_std/path/mod.ts";

import log from "../logging.ts";
import { load } from "../loader.ts";
import { ConfigNotFound } from "../errors.ts";
import { TaskPath } from "../tasks/path.ts";
import { ProjectConfig } from "./config.ts";
import { Project } from "./impl.ts";

export const _internals = {};

export class Resolver {
  #baseDir: string;
  #root?: Project;
  #cached: Record<string, Project>;

  constructor(path: string) {
    // assume base dir is an absolute path
    this.#baseDir = path;
    this.#cached = {};
  }

  get baseDir() {
    return this.#baseDir;
  }

  get root(): Project {
    return this.#root!;
  }

  get projects(): Project[] {
    return Object.values(this.#cached);
  }

  async open(): Promise<Project> {
    if (!this.#root) {
      await this.#resolveRoot();
    }

    throw new Error("not implemented");
  }

  #toRootPath(path: string, base = this.#baseDir): string {
    return "//" + path.substring(common([base, path]).length);
  }

  async #resolveConfig(
    path: string,
    base: string,
    asRoot = true,
  ): Promise<ProjectConfig | undefined> {
    log.debug(`resolver loading config at ${join(base, path)}...`);

    // TODO: apply this to load() ... somehow
    let cfg = await load(join(base, path));
    cfg = cfg && {
      ...cfg,
      path: asRoot ? this.#toRootPath(path, base) : path,
    };

    return cfg;
  }

  async #resolveRoot(): Promise<void> {
    log.debug("start resolveRoot()");

    const found: ProjectConfig[] = [];

    // step 1: find a the root (walking up)
    let cfg: ProjectConfig | undefined = undefined;
    let working = this.#baseDir;
    while ((working !== "/") && (cfg === undefined || !cfg.root)) {
      cfg = await this.#resolveConfig(working, "", false);
      if (cfg) {
        log.debug(` .... resolver found config at ${cfg.path}`);
        found.unshift(cfg);
      } else {
        log.debug(`.... resolve no config at ${working}`);
      }
      working = dirname(working);
    }

    // no configurations found!
    if (!cfg) {
      log.error(`no config found at path or ancestors: "${this.#baseDir}"`);
      throw new ConfigNotFound(this.#baseDir);
    }

    // step 2: update base dir
    this.#baseDir = cfg.path;
    log.debug(`resolver baseDir is now ${this.#baseDir}`);

    // step 3: create + cache [root .. start]
    let parent: Project | undefined = undefined;
    for (let curr of found) {
      const needsRoot = !this.#root;

      log.debug(`${curr.path} is forced to root?: ${needsRoot}`);

      // translate path to root
      curr = {
        ...curr,
        path: "//" +
          curr.path.substring(common([curr.path, this.#baseDir]).length),
        root: needsRoot,
      };

      log.debug(`resolver creating project at ${curr.path} ...`);

      // create project
      const prj: Project = new Project(curr, parent);
      if (needsRoot) {
        this.#root = prj;
      }
      parent = prj;

      // cache it
      this.#cached[prj.path] = prj;
    }

    log.debug("end resolveRoot()");
  }
}
