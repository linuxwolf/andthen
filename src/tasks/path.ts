/** */

import { join } from "deno_std/path/mod.ts";

import { InvalidTaskPath } from "../errors.ts";

enum TaskPathKind {
  ABSOLUTE,
  ROOT,
  RELATIVE,
}

export type TaskPathArg = string | TaskPath;

// ##### HELPERS #####

function findTask(input: string): [string, string] {
  let task = "";
  const pos = input.lastIndexOf(":");
  if (pos !== -1) {
    task = input.substring(pos + 1);
    input = input.substring(0, pos);
  }

  return [input, task];
}

function findSegments(path: string): string[] {
  const result: string[] = [];
  let pos = 0;

  while (path) {
    pos = path.indexOf("/", pos);
    if (pos === -1) {
      result.push(path);
      path = "";
    } else if (path[pos - 1] === "\\") {
      pos++;
    } else {
      result.push(path.substring(0, pos));
      path = path.substring(pos + 1);
      pos = 0;
    }
  }

  return result;
}

function normalizeSegments(segments: string[]): string[] {
  const result: string[] = [];

  for (const s of segments) {
    switch (s) {
      case ".":
        if (result.length === 0) {
          result.push(".");
        }
        break;
      case "..":
        if (result.length > 0) {
          const prev = result.pop();
          if (prev === "..") {
            result.push(prev);
            result.push("..");
          }
        } else {
          result.push("..");
        }
        break;
      default:
        result.push(s);
    }
  }

  return result;
}

// ##### EXPORTED #####

export class TaskPath {
  #kind: TaskPathKind;
  #ref: string;

  readonly task: string;
  readonly path: string;
  readonly segments: string[];

  constructor(input: string) {
    const original = input;

    let kind: TaskPathKind;
    if (input.startsWith("//")) {
      kind = TaskPathKind.ROOT;
      input = input.substring(2);
    } else if (input.startsWith("/")) {
      kind = TaskPathKind.ABSOLUTE;
      input = input.substring(1);
    } else {
      kind = TaskPathKind.RELATIVE;
    }
    this.#kind = kind;
    const prefix = (kind === TaskPathKind.ROOT) ? "//" : "";

    const [path, task] = findTask(input);
    this.task = task;

    let segments = findSegments(path);
    segments = normalizeSegments(segments);

    // last-mile transformations/validations
    if (this.#kind === TaskPathKind.RELATIVE) {
      const s = segments.shift();
      if (s && s !== ".") {
        segments.unshift(s);
      }
    } else {
      if (segments[0] && segments[0].startsWith(".")) {
        throw new InvalidTaskPath(original);
      }
    }

    this.segments = segments;
    this.path = ((p) => {
      switch (this.#kind) {
        case TaskPathKind.ABSOLUTE:
          return "/" + p;
        case TaskPathKind.RELATIVE:
          if (p === "") {
            return "./";
          }
          break;
      }
      return p;
    })(segments.join("/"));

    this.#ref = `${prefix}${this.path}`;
    if (this.task) {
      this.#ref += `:${this.task}`;
    }
  }

  get isRelative() {
    return this.#kind === TaskPathKind.RELATIVE;
  }
  get isRoot() {
    return this.#kind === TaskPathKind.ROOT;
  }
  get isAbsolute() {
    return this.#kind === TaskPathKind.ABSOLUTE;
  }

  get prefix(): string {
    switch (this.#kind) {
      case TaskPathKind.ROOT:
        return "//";
      case TaskPathKind.ABSOLUTE:
        return "/";
    }
    return "";
  }

  resolveFrom(base: TaskPath): TaskPath {
    if (!this.isRelative) {
      return this;
    }

    const path = [
      ...base.segments,
      ...this.segments,
    ].join("/");
    return new TaskPath(`${base.prefix}${path}:${this.task}`);
  }
  resolvePathFrom(base: { current?: string; root?: string }): string {
    if (this.isAbsolute) {
      return this.path;
    }

    const baseDir = (this.isRoot ? base.root : base.current) || "";
    return join(baseDir, this.path);
  }

  toString() {
    return this.#ref;
  }

  static from(path: TaskPathArg): TaskPath {
    if (path instanceof TaskPath) {
      return path as TaskPath;
    }
    return new TaskPath(path as string);
  }
}
