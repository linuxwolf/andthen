import { path, yaml } from "../deps.ts";
import { fs } from "../internals.ts";

import { ProjectBuilder } from "../core/project.ts";
import { TargetBuilder, TargetConfig } from "../core/target.ts";
import { Optional } from "../util/types.ts";
import { VariableBuiler, Variables } from "../core/vars.ts";
import * as errors from "../errors/mod.ts";

export type ConfigInfo = {
  basepath: string;
  configpath: string;
};

const CANDIDATE_NAMES = [
  "andthen.yaml",
  "andthen.yml",
];

type ConfigRecord = Record<string, unknown>;

export class Parser {
  readonly basedir: string;

  constructor(basedir: string) {
    this.basedir = basedir;
  }

  async findConfig(filepath?: string): Promise<ConfigInfo> {
    const resolved = (filepath)
      ? path.join(this.basedir, filepath)
      : this.basedir;
    return await this._doFind(resolved);
  }
  private async _doFind(filepath: string): Promise<ConfigInfo> {
    const stat = await fs.stat(filepath).catch((_err) => {
      // TODO: loggit _err
      throw new errors.ConfigMissing(filepath);
    });

    if (stat.isFile) {
      const cfgfile = path.basename(filepath);
      if (!CANDIDATE_NAMES.includes(cfgfile)) {
        throw new errors.InvalidFile(filepath, "does not match pattern");
      }

      const basepath = path.dirname(filepath);
      return {
        basepath,
        configpath: filepath,
      };
    }

    if (!stat.isDirectory) {
      throw new errors.InvalidFile(filepath, "expected directory");
    }

    const settled = await Promise.allSettled(
      CANDIDATE_NAMES.map((candidate: string) => {
        return this._doFind(path.join(filepath, candidate));
      }),
    );
    const reasons = [];
    for (const result of settled) {
      switch (result.status) {
        case "fulfilled":
          return result.value;
        case "rejected":
          reasons.push(result.reason);
          break;
      }
    }

    // TODO: loggit reasons
    throw new errors.ConfigMissing(filepath);
  }

  async load(filepath?: string): Promise<ProjectBuilder> {
    const configInfo = await this.findConfig(filepath);
    const { basepath, configpath } = configInfo;
    const doc = await this.parseYaml(configpath).then((doc) => doc || {});
    const builder = new ProjectBuilder(basepath);

    // process options
    if ("root" in doc) {
      if (typeof doc.root !== "boolean") {
        throw new TypeError("root is not a boolean");
      }
      builder.asRoot(doc.root as boolean);
    }
    if ("default" in doc) {
      if (typeof doc.default !== "string") {
        throw new TypeError("default is not a string");
      }
      builder.withDefault(doc.default as string);
    }

    // process variables
    this.parseVariables((doc.vars || doc.variables) as Variables, builder);

    //  process targets
    for (const entry of (doc.targets || []) as ConfigRecord[]) {
      const tgt = this.parseTarget(entry);
      builder.withTarget(tgt);
    }

    return builder;
  }
  private async parseYaml(filepath: string): Promise<Record<string, unknown>> {
    const content = await fs.readTextFile(filepath);
    const doc = yaml.parse(content, {
      filename: filepath,
    });

    return doc as Record<string, unknown>;
  }
  private parseVariables(vars: Variables = {}, builder: VariableBuiler) {
    for (const [key, value] of Object.entries(vars)) {
      builder.withVariable(key, value);
    }
  }
  private parseTarget(entry: ConfigRecord): TargetBuilder {
    if (!entry.name) {
      throw new TypeError("target missing name");
    }
    const name = entry.name as string;
    const cfg: TargetConfig = {
      name,
      description: (entry.desc || entry.description) as Optional<string>,
      variables: (entry.vars || entry.variables) as Optional<Variables>,
      dependencies: (entry.deps || entry.dependencies) as Optional<string[]>,
      action: (entry.act || entry.action) as string,
      output: (entry.out || entry.output) as string,
    };
    const builder = new TargetBuilder(cfg.name);
    if (cfg.description) {
      builder.withDescription(cfg.description);
    }
    if (cfg.action) {
      builder.withAction(cfg.action);
    }
    if (cfg.output) {
      builder.withOutput(cfg.output);
    }
    if (cfg.dependencies) {
      builder.dependsOn(...cfg.dependencies);
    }
    if (cfg.variables) {
      this.parseVariables(cfg.variables, builder);
    }

    return builder;
  }
}
