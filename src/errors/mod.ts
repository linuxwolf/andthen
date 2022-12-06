import { ErrBase } from "./base.ts";

export class DuplicateTarget extends ErrBase {
  readonly target: string;

  constructor(target: string, msg = "duplicate target") {
    super(msg, { target });
    this.target = target;
  }
}

export class DuplicateVariable extends ErrBase {
  readonly variable: string;

  constructor(variable: string, msg = "duplicate variable") {
    super(msg, { variable });
    this.variable = variable;
  }
}

export class InvalidName extends ErrBase {
  readonly value: string;

  constructor(value: string, msg = "invalid name") {
    super(msg, { value });
    this.value = value;
  }
}

export class ConfigMissing extends ErrBase {
  readonly filepath: string;

  constructor(filepath: string, msg = "configuration not found") {
    super(msg, { filepath });
    this.filepath = filepath;
  }
}
export class InvalidFile extends ErrBase {
  readonly filepath: string;

  constructor(filepath: string, msg = "invalid file") {
    super(msg, { filepath });
    this.filepath = filepath;
  }
}
export class ShellError extends ErrBase {
  readonly code: number;

  constructor(code: number, msg = "shell errored") {
    super(msg, { code });
    this.code = code;
  }
}
