export interface ActionContext {
  readonly env: Record<string, string>;
  readonly cwd: string;
}
