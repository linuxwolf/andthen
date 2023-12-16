/** */

import { join } from "deno_std/path/mod.ts";
import { parse as yaml } from "deno_std/yaml/mod.ts";

import log from "./logging.ts";
import { asConfig, ProjectConfig } from "./projects/config.ts";
import { MalformedConfig } from "./errors.ts";

const CONFIG_FILES = [
  "andthen.yaml",
  "andthen.yml",
  ".andthen.yaml",
  ".andthen.yml",
] as const;

async function locateConfig(abs: string): Promise<string | undefined> {
  for (const fname of CONFIG_FILES) {
    const fpath = join(abs, fname);
    try {
      return await Deno.readTextFile(fpath);
    } catch (e) {
      log.debug(`loading ${fname} in ${abs} failed: ${e}`);
    }
  }
}

function loadContent(name: string, content: string): ProjectConfig {
  const data = yaml(content);
  const cfg = asConfig(name, data);

  return cfg;
}

export const _internals = {
  locateConfig,
  loadContent,
  CONFIG_FILES,
};

export async function load(path: string): Promise<ProjectConfig | undefined> {
  const content = await _internals.locateConfig(path);
  if (content === undefined) {
    log.verbose(`loading failed: no config found in directory (${path})`);
    return undefined;
  }

  try {
    return _internals.loadContent(path, content);
  } catch (e) {
    log.error(`loading failed: bad config (${path}) ${Deno.inspect(e)}`);
    throw new MalformedConfig(path);
  }
}
