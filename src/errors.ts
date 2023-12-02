/** */

export function format(msg: string, extra?: Record<string, unknown>) {
  extra = { ...extra };
  const details = Object.entries(extra).map(([k, v]) => {
    return `${k}=${Deno.inspect(v)}`;
  }).join(", ");

  if (!details) {
    return msg;
  }

  return `${msg} (${details})`;
}

export abstract class ErrorBase extends Error {
  constructor(msg: string, extra?: Record<string, unknown>) {
    super(format(msg, extra));
    this.name = this.constructor.name;
  }
}

// ##### DEFINED ERRORS #####

export class InvalidVariableName extends ErrorBase {
  readonly varname: string;

  constructor(varname: string, msg = "invalid variable name") {
    super(msg, { varname });
    this.varname = varname;
  }
}
