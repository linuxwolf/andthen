import { path } from "../deps.ts";

const { posix } = path;

export class Target {
  readonly path: string;
  readonly task: string;
  readonly absolute: boolean;
  readonly segments: string[];

  constructor(path: string, task: string, absolute: boolean, segments: string[]) {
    this.path = path;
    this.task = task;
    this.absolute = absolute;
    this.segments = segments;
  }

  toString(): string {
    return `${this.path}:${this.task}`;
  }
}

export function target(target: string, base?: string): Target {
  if (!target.startsWith("/") && !!base) {
    // apply base if target is not absolute
    target = base + "/" + target;
  }

  // TODO: optimize this
  // walk target backward into segments
  let segments: string[] = [];
  let absolute = false;
  let remainder = target;
  while (remainder !== "") {
    const p = posix.parse(remainder);
    remainder = p.dir;
    if (p.base !== "") {
      segments.unshift(p.base);
    }
    absolute = p.dir === "/";
    remainder = absolute ? "" : p.dir;
  }

  // extract task (or use default)
  let [endPath, task] = (segments.pop() || "").split(":", 2);
  if (!task) {
    task = "default";
  }
  segments.push(endPath);

  // simplify segments
  segments = segments.reduce((acc: string[], segment: string): string[] => {
    let prev: string | undefined;
    switch (segment) {
      case "..":
        // lose parent and current segments; unless ...
        prev = acc.pop();
        if (prev === undefined || prev === "..") {
          // parent is relative or no parent yet, then keep ".."
          prev && acc.push(prev);
          acc.push("..");
        }
        break;
      case ".":
        // lose current segment
        break;
      case "":
        // lose empty
        break;
      default:
        acc.push(segment);
    }
    return acc;
  }, []);

  // populate fields
  const fullPath = (absolute ? "/" : "") + segments.join("/");
  return new Target(
    fullPath,
    task,
    absolute,
    segments,
  );
}
