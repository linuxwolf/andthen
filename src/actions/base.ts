/** */

export interface ActionConfig {
  readonly type: string;
}

export abstract class Action {
  constructor(_cfg: ActionConfig) {}

  abstract get type(): string;

  abstract toConfig(): ActionConfig;
}
