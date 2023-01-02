import { path } from "../deps.ts";
import { normalize } from "../util/normalize.ts";
import { Optional } from "../util/types.ts";

import { Parser } from "../parser/yaml.ts";
import { Project, ProjectBuilder } from "./project.ts";
import { Target, TargetPath, TargetPathType } from "./target.ts";
import * as errors from "../errors/mod.ts";
import log from "../log.ts";

export class ProjectLoader {
  readonly cache: Record<string, Project> = {};

  parse(filepath: string): Promise<ProjectBuilder> {
    return (new Parser()).load(filepath);
  }

  async load(dir: string): Promise<ProjectBuilder> {
    dir = normalize(dir);

    let project: Optional<ProjectBuilder> = undefined;
    let curr = dir;
    do {
      try {
        log.debug(`loading project from ${curr}...`);
        project = await this.parse(curr);
      } catch (err) {
        log.debug(`failed to load project from ${curr}: ${err.message}`);
        const parent = path.dirname(curr);
        if (parent === curr) {
          throw new errors.ConfigMissing(dir);
        }
        curr = parent;
      }
    } while (!project);

    return project;
  }

  async build(
    dir: string,
    root: Optional<Project> = undefined,
  ): Promise<Project> {
    dir = normalize(dir);

    let project = this.cache[dir];
    if (project) {
      return project;
    }

    const builder = await this.load(dir);
    if (!builder.root) {
      try {
        project = await this.build(path.dirname(dir), root);
      } catch (e) {
        log.debug(`failed to build project: ${e.message}`);
        // treat latest builder as root
        builder.asRoot();
      }
    }
    project = builder.build(project);
    this.cache[project.filepath] = project;

    return project;
  }
}

export class ResolverContext {
  private loader: ProjectLoader;
  readonly current: Project;
  readonly root: Project;

  constructor(loader: ProjectLoader, project: Project) {
    this.loader = loader;
    this.current = project;
    this.root = project.rootProject;
  }

  targetPath(filepath: string): TargetPath {
    const tpath = new TargetPath(filepath);
    let base: TargetPath;
    switch (tpath.type) {
      case TargetPathType.Root:
        base = new TargetPath(this.root.filepath);
        break;
      case TargetPathType.Relative:
        base = new TargetPath(this.current.filepath);
        break;
      case TargetPathType.Absolute:
        // verify path is a sub-path of the root
        if (
          path.common([
            this.root.filepath,
            tpath.path,
          ]) !== (this.root.filepath + "/")
        ) {
          throw new errors.InvalidPath(filepath, "absolute path not allowed");
        }
        return tpath;
    }

    return tpath.relativeTo(base);
  }

  private async _resolve(resolved: string): Promise<Project> {
    switch (resolved) {
      case this.current.filepath:
        return this.current;
      case this.root.filepath:
        return this.root;
      default:
        return await this.loader.build(resolved);
    }
  }
  async resolveProject(filepath: string): Promise<Project> {
    const tpath = this.targetPath(filepath).path;
    return await this._resolve(tpath);
  }

  async resolveTarget(filepath: string): Promise<Target> {
    const tpath = this.targetPath(filepath);
    const project = await this._resolve(tpath.path);
    return await project.resolve(tpath.target);
  }
}

export class Resolver {
  readonly root: Project;
  private readonly loader: ProjectLoader;

  private constructor(root: Project, loader: ProjectLoader) {
    this.root = root;
    this.loader = loader;
  }

  static async create(dir: string): Promise<Resolver> {
    // ensure dir starts as an absolute path
    dir = path.resolve(dir);

    const loader = new ProjectLoader();
    const prj = await loader.build(dir);
    const root = prj.rootProject;

    return new Resolver(root, loader);
  }

  within(project: Project): Promise<ResolverContext>;
  within(filepath: string): Promise<ResolverContext>;
  async within(prjOrPath: Project | string): Promise<ResolverContext> {
    const project = (typeof prjOrPath === "string")
      ? await this.loader.build(prjOrPath)
      : prjOrPath as Project;

    return new ResolverContext(this.loader, project);
  }
}
