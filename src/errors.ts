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

export class InvalidLogLevel extends ErrorBase {
  readonly level: string;

  constructor(level: string, msg = "invalid log level") {
    super(msg, { level });
    this.level = level;
  }
}

export class InvalidVariableName extends ErrorBase {
  readonly varname: string;

  constructor(varname: string, msg = "invalid variable name") {
    super(msg, { varname });
    this.varname = varname;
  }
}

export class InvalidRootProject extends ErrorBase {
  readonly project: string;

  constructor(project: string, msg = "invalid root project") {
    super(msg, { project });
    this.project = project;
  }
}

export class ConfigNotFound extends ErrorBase {
  readonly path: string;

  constructor(path: string, msg = "config not found") {
    super(msg, { path });
    this.path = path;
  }
}

export class MalformedConfig extends ErrorBase {
  readonly path: string;

  constructor(path: string, msg = "malformed config") {
    super(msg, { path });
    this.path = path;
  }
}

export class InvalidTaskPath extends ErrorBase {
  readonly path: string;

  constructor(path: string, msg = "invalid task path") {
    super(msg, { path });
    this.path = path;
  }
}

export class TaskNotFound extends ErrorBase {
  readonly path: string;

  constructor(path: string, msg = "task not found") {
    super(msg, { path });
    this.path = path;
  }
}

export class CircularDependency extends ErrorBase {
  readonly paths: string[];

  constructor(paths: string[], msg = "circular dependency") {
    super(msg, { paths });
    this.paths = paths;
  }
}
