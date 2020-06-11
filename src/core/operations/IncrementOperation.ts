import { Operation } from '.';

export const NAME_INCREMENT = 'Increment';
export const NAME_DECREMENT = 'Decrement';

export class IncrementOperation extends Operation {
  extra: { amount: number };

  constructor(amount = 1) {
    super(amount >= 0 ? NAME_INCREMENT : NAME_DECREMENT, { amount });
  }

  merge(base: Operation): this {
    if (base instanceof IncrementOperation) {
      this.extra.amount += base.extra.amount;
      this.name = this.extra.amount >= 0 ? NAME_INCREMENT : NAME_DECREMENT;
    }
    return this;
  }

  apply(value: unknown): unknown {
    if (typeof value === 'number') {
      return value + this.extra.amount;
    }
    return this.extra.amount;
  }
}
