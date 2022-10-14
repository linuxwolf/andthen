import { path } from "../deps.ts";

const { posix } = path;

export interface Target {
  readonly path: string;
  readonly task: string;
  readonly absolute: boolean;
  readonly segments: string[];

  toString(): string;
}

export function parse(target: string): Target {
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
  return {
    path: fullPath,
    task,
    absolute,
    segments,

    toString() { return `${fullPath}:${task}`; }
  };
}
