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

interface ResolveProjectResult {
  project?: Project;
  filepath: string;
}

export class Resolver {
  #workingDir: string;
  #workingPath: TaskPath;
  #rootDir: string;
  #root?: Project;
  #cached: Record<string, Project>;

  constructor(path: string) {
    // assume base dir is an absolute path
    this.#workingDir = path;
    this.#workingPath = new TaskPath("//");
    this.#rootDir = "";
    this.#cached = {};
  }

  get workingDir() {
    return this.#workingDir;
  }

  get workingPath() {
    return this.#workingPath;
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
    const resolved = TaskPath.from(path).resolveFrom(this.workingPath);
    if (resolved.isAbsolute) {
      throw new InvalidTaskPath(resolved.path, "no absolute paths allowed");
    }

    const { project } = await this.#resolveProject(resolved, {});

    return project!;
  }

  forPath(path: string | TaskPath): Resolver {
    const dst = TaskPath.from(path).resolveFrom(this.#workingPath);
    if (dst.isAbsolute) {
      throw new InvalidTaskPath(dst.path, "no absolute paths allowed");
    }

    const result = new Resolver(this.#rootDir);
    result.#root = this.#root;
    result.#rootDir = this.#rootDir;
    result.#cached = this.#cached;

    result.#workingPath = dst;
    result.#workingDir = dst.resolvePathFrom({
      current: this.#workingDir,
      root: this.#rootDir,
    });

    return result;
  }

  #toRootPath(path: string, base = this.#rootDir): string {
    return "//" + path.substring(common([base, path]).length);
  }

  async #resolveProject(
    path: string | TaskPath,
    opts: ResolveProjectOpts,
  ): Promise<ResolveProjectResult> {
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
    let workingPath = resolvedPath;
    let done = false;
    if (!prj) {
      // step 2.1: load config
      let cfg: ProjectConfig | undefined;
      do {
        cfg = await this.#resolveConfig(workingPath, options);
        if (!cfg) {
          if (workingPath === "/") {
            done = true;
          } else {
            workingPath = dirname(workingPath);
          }
        }
      } while (!done && !cfg && !strict);

      if (!cfg && strict) {
        throw new ConfigNotFound(resolvedPath);
      } else if (!cfg) {
        return { project: undefined, filepath: resolvedPath };
      }

      // step 2.2: hydrate parents
      let parent: Project | undefined;
      if (!cfg.root) {
        const parentPath = dirname(workingPath);
        const result = await this.#resolveProject(parentPath, {
          ...options,
          strict: false,
        });
        parent = result.project;
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

    return {
      project: prj,
      filepath: workingPath,
    };
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

    let { project, filepath } = await this.#resolveProject(this.#workingDir, {
      baseDir: "/",
      rootPath: false,
      strict: false,
      caching: false,
    });
    if (!project) {
      log.error(`no config found at path or ancestors: "${this.#workingDir}"`);
      throw new ConfigNotFound(this.#workingDir);
    }

    const found = [project!.toConfig()];
    while (!project.root) {
      project = project.parent!;
      filepath = dirname(filepath);
      found.unshift(project.toConfig());
    }

    // reset directories and paths
    this.#rootDir = filepath;
    log.debug(`resolver rootDir is now ${this.#rootDir}`);
    this.#workingPath = new TaskPath(
      "//" +
        this.#workingDir.substring(
          common([this.#rootDir, this.#workingDir]).length,
        ),
    );

    // step 3: recreate + cache [root .. start]
    let parent: Project | undefined = undefined;
    for (let curr of found) {
      const needsRoot = !this.#root;

      log.debug(`${curr.path} is forced to root?: ${needsRoot}`);

      // translate path to root
      curr = {
        ...curr,
        path: this.#toRootPath(curr.path),
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
