/** */

import { Variables, VariablesContext } from "../vars.ts";

export interface ActionConfig {
  readonly type: string;
  readonly vars?: Variables;
}

export abstract class Action implements VariablesContext {
  #vars: Variables;

  constructor(cfg: ActionConfig) {
    this.#vars = { ...(cfg.vars ?? {}) };
  }

  abstract get type(): string;

  get vars() {
    return { ...this.#vars };
  }

  abstract toConfig(): ActionConfig;
}
