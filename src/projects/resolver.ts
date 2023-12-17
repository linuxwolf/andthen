/** */

import { common, dirname, join } from "deno_std/path/mod.ts";

import log from "../logging.ts";
import { ConfigNotFound, InvalidTaskPath } from "../errors.ts";
import { load } from "../loader.ts";
import { TaskPath } from "../tasks/path.ts";
import { ProjectConfig } from "./config.ts";
import { Project } from "./impl.ts";

export const _internals = {
  load,
};

interface ResolveProjectOpts {
  baseDir?: string;
  strict?: boolean;
  rootPath?: boolean;
  caching?: boolean;
}

export class Resolver {
  #workingDir: string;
  #rootDir: string;
  #root?: Project;
  #cached: Record<string, Project>;

  constructor(path: string) {
    // assume base dir is an absolute path
    this.#workingDir = path;
    this.#rootDir = "";
    this.#cached = {};
  }

  get workingDir() {
    return this.#workingDir;
  }

  get rootDir() {
    return this.#rootDir;
  }

  get root(): Project {
    return this.#root!;
  }

  get projects(): Project[] {
    return Object.values(this.#cached);
  }

  get initialized(): boolean {
    return this.#root !== undefined;
  }

  async init(): Promise<void> {
    if (!this.#root) {
      await this.#resolveRoot();
    }
  }

  async open(path: string | TaskPath): Promise<Project> {
    const resolved = TaskPath.from(path);
    if (resolved.isAbsolute) {
      throw new InvalidTaskPath(resolved.path, "no absolute paths allowed");
    }

    const result = await this.#resolveProject(path, {});

    return result!;
  }

  #toRootPath(path: string, base = this.#rootDir): string {
    return "//" + path.substring(common([base, path]).length);
  }

  async #resolveProject(
    path: string | TaskPath,
    opts: ResolveProjectOpts,
  ): Promise<Project | undefined> {
    const options: Required<ResolveProjectOpts> = {
      baseDir: this.#rootDir,
      strict: true,
      rootPath: true,
      caching: true,
      ...opts,
    };
    const {
      baseDir,
      rootPath,
      strict,
      caching,
    } = options;

    // step 1: canonicalize path
    const resolvedPath = TaskPath.from(path)
      .resolveFrom(new TaskPath(rootPath ? "//" : baseDir))
      .path;

    // step 2: retrieve / create project
    let prj = this.#cached["//" + resolvedPath];
    if (!prj) {
      // step 2.1: load config
      let cfg: ProjectConfig | undefined;
      let workingPath = resolvedPath;
      do {
        cfg = await this.#resolveConfig(workingPath, options);
        if (!cfg) {
          workingPath = dirname(workingPath);
        }
      } while (!cfg && !strict);

      if (!cfg && strict) {
        throw new ConfigNotFound(resolvedPath);
      } else if (!cfg) {
        return undefined;
      }

      // step 2.2: hydrate parents
      let parent: Project | undefined;
      if (!cfg.root) {
        const parentPath = dirname(workingPath);
        parent = await this.#resolveProject(parentPath, {
          ...options,
          strict: false,
        });
      }

      // step 2.3: create project
      if (!parent) {
        // treat as root anyway
        cfg = {
          ...cfg,
          root: true,
        };
      }
      prj = new Project(cfg, parent);
      if (caching) {
        this.#cached[prj.path] = prj;
      }
    }

    return prj;
  }

  async #resolveConfig(
    path: string,
    opts: ResolveProjectOpts,
  ): Promise<ProjectConfig | undefined> {
    const options: Required<ResolveProjectOpts> = {
      baseDir: this.#rootDir,
      strict: false,
      rootPath: true,
      caching: false,
      ...opts,
    };

    const { baseDir, rootPath } = options;

    log.debug(`resolver loading config at ${join(baseDir, path)}...`);

    // TODO: apply this to load() ... somehow
    let cfg = await _internals.load(join(baseDir, path));
    cfg = cfg && {
      ...cfg,
      path: rootPath ? this.#toRootPath(path, baseDir) : path,
    };

    return cfg;
  }

  async #resolveRoot(): Promise<void> {
    log.debug("start resolveRoot()");

    const found: ProjectConfig[] = [];

    // step 1: find a the root (walking up)
    let cfg: ProjectConfig | undefined = undefined;
    let working = this.#workingDir;
    let done = false;
    while (!done && (cfg === undefined || !cfg.root)) {
      cfg = await this.#resolveConfig(working, {
        baseDir: "/",
        rootPath: false,
      });
      if (cfg) {
        log.debug(` .... resolver found config at ${cfg.path}`);
        found.unshift(cfg);
      } else {
        log.debug(`.... resolve no config at ${working}`);
      }

      if (working === "/" && !done) {
        done = true;
      } else {
        working = dirname(working);
      }
    }

    // no configurations found!
    if (!cfg) {
      log.error(`no config found at path or ancestors: "${this.#workingDir}"`);
      throw new ConfigNotFound(this.#workingDir);
    }

    // step 2: update base dir
    this.#rootDir = cfg.path;
    log.debug(`resolver rootDir is now ${this.#rootDir}`);

    // step 3: create + cache [root .. start]
    let parent: Project | undefined = undefined;
    for (let curr of found) {
      const needsRoot = !this.#root;

      log.debug(`${curr.path} is forced to root?: ${needsRoot}`);

      // translate path to root
      curr = {
        ...curr,
        path: "//" +
          curr.path.substring(common([curr.path, this.#rootDir]).length),
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
