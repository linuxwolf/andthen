/** */

import { join } from "@std/path";
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
  load: (path: string) => Promise<ProjectConfig>;
}
export const _internals: Internals = {
  load,
};

const CANDIDATES = [
  "andthen.yaml",
  "andthen.yml",
  ".andthen.yaml",
  ".andthen.yml",
];

async function load(path: string): Promise<ProjectConfig> {
  for (const check of CANDIDATES) {
    const abs = join(path, check);
    try {
      const text = await Deno.readTextFile(abs);
      const data = parseYaml(text, { schema: "core" });
      return parseProject(path, data);
    } catch (err) {
      log.debug`could not load from ${abs}: ${err.message}`;
    }
  }

  throw new errors.ConfigNotFound(path);
}
