export abstract class Operation {
  name: string;
  extra: Record<string, unknown>;

  constructor(name: string, extra?: Record<string, unknown>) {
    this.name = name;
    this.extra = extra;
  }

  abstract merge(base: Operation): this;
  abstract apply(value: unknown): unknown;

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

export * from './IncrementOperation';
export * from './DeleteOperation';
export * from './AddOperation';
export * from './AddUniqueOperation';
