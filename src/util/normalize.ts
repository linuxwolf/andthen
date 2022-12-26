import { path } from "../deps.ts";

export function normalize(dir: string): string {
  dir = path.normalize(dir);
  if (dir.endsWith(path.SEP)) {
    return dir.substring(0, dir.length - path.SEP.length);
  }
  return dir;
}
