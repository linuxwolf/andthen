import { dirname, join, relative } from "@std/path";
import { parse as parseYaml } from "@std/yaml";
import { ProjectConfig, parse as parseProject } from "./config.ts";

export const _internals = {
  readTextFile: Deno.readTextFile,
};

const MANIFESTS = [
  "andthen.yaml",
  "andthen.yml",
  ".andthen.yaml",
  ".andthen.yml",
]

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

export async function locate(path: string) {
  let data: unknown | undefined;
  let current = path;
  let prev = current;
  let done = false;

  while (!done) {
    data = await loadFrom(current);
    prev = current;
    current = dirname(current);
    done = (data !== undefined) || (current === prev);
  }

  if (data === undefined) {
    return undefined;
  }
  return parseProject(prev, data);
}
