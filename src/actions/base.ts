/** */

import { z } from "zod";

import { Variables } from "../vars.ts";

export const BaseActionSchema = z.object({
  vars: z.record(z.string()).optional(),
});
export type BaseActionConfig = z.infer<typeof BaseActionSchema>;

export abstract class Action {
  #vars: Variables;

  constructor(cfg: BaseActionConfig) {
    this.#vars = { ...cfg.vars };
  }

  abstract get type(): string;
  get vars() {
    return { ...this.#vars };
  }

  toConfig(): BaseActionConfig {
    const vars = this.vars;

    return {
      ...((Object.entries(vars).length > 0) && { vars }),
    };
  }
}
