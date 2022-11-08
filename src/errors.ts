import { ErrBase } from "./errors/base.ts";

export class DuplicateTarget extends ErrBase {
  readonly task: string;

  constructor(task: string, msg = "duplicate task") {
    super(msg, { task });
    this.task = task;
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
