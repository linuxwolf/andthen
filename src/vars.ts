/** */

export type Variables = Record<string, string>;

export interface VariablesContext {
  readonly parent?: VariablesContext;
  readonly vars: Variables;
}

export function format(ctx: VariablesContext, envs?: Variables): Variables {
  if (!envs) {
    envs = {};
  }

  if (ctx.parent) {
    envs = format(ctx.parent, envs);
  }

  for (const [name, value] of Object.entries(ctx.vars)) {
    envs[name] = value;
  }

  return envs;
}
