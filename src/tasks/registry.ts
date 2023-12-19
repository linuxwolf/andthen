/** */

import { Task } from "./impl.ts";
import { TaskPath } from "./path.ts";

export interface TaskRegistry {
  get(path: string | TaskPath): Promise<Task>;
}
