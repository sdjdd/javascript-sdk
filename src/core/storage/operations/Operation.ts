export abstract class Operation {
  name: string;
  extra: Record<string, unknown>;

  constructor(name: string, extra?: Record<string, unknown>) {
    this.name = name;
    this.extra = extra;
  }

  toJSON(): unknown {
    return {
      ...this.extra,
      __op: this.name,
    };
  }

  toString(): string {
    return JSON.stringify(this);
  }
}
