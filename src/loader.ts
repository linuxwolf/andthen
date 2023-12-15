/** */

import * as path from "deno_std/path/mod.ts";
import { parse as yaml } from "deno_std/yaml/mod.ts";

import log from "./logging.ts";
import { asConfig, ProjectConfig } from "./projects/config.ts";
import { ConfigNotFound, MalformedConfig } from "./errors.ts";

const CONFIG_FILES = [
  "andthen.yaml",
  "andthen.yml",
  ".andthen.yaml",
  ".andthen.yml",
];

export async function locateConfig(abs: string): Promise<string | undefined> {
  for (const fname of CONFIG_FILES) {
    const fpath = path.join(abs, fname);
    try {
      return await Deno.readTextFile(fpath);
    } catch (e) {
      log.debug(`loading ${fname} in ${abs} failed: ${e}`);
    }
  }
}

export function loadContent(name: string, content: string): ProjectConfig {
  const data = yaml(content);
  const cfg = asConfig(name, data);

  return cfg;
}

export const _internals = {
  resolvePath: path.resolve,
  basename: path.basename,
  locateConfig,
  loadContent,
};

export async function load(dir: string): Promise<ProjectConfig> {
  const abs = _internals.resolvePath(dir);
  const name = _internals.basename(abs);

  const content = await _internals.locateConfig(abs);
  if (content === undefined) {
    log.error(`loading failed: no config found in directory (${abs})`);
    throw new ConfigNotFound(abs);
  }

  try {
    return _internals.loadContent(name, content);
  } catch (e) {
    log.error(`loading failed: bad config (${abs}) ${Deno.inspect(e)}`);
    throw new MalformedConfig(abs);
  }
}
