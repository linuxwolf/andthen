export function format(msg: string, details?: Record<string, unknown>) {
  const extra: string[] = [];

  for (const [key, value] of Object.entries(details || {})) {
    const str = Deno.inspect(value);
    extra.push(`${key}: ${str}`);
  }

  if (extra.length > 0) {
    return `${msg}: ( ${extra.join(", ")} )`;
  }
  return msg;
}

export abstract class ErrorBase extends Error {
  constructor(msg: string, details?: Record<string, unknown>) {
    super(format(msg, details));
    this.name = this.constructor.name;
  }
}

export class ProjectNotFoundError extends ErrorBase {
  readonly path: string;

  constructor(path: string, msg = "no project found") {
    super(msg, { path });
    this.path = path;
  }
}

export class NotReadyError extends ErrorBase {
  constructor(msg = "not ready") {
    super(msg);
  }
}
