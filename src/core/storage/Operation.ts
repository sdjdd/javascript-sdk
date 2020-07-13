import { IOperation } from '../types';

export class Operation {
  static delete(): IOperation {
    return { __op: 'Delete' };
  }

  static increment(amount = 1): IOperation {
    return { __op: 'Increment', amount };
  }

  static decrement(amount = 1): IOperation {
    return { __op: 'Decrement', amount };
  }

  static add(objects: unknown[]): IOperation {
    return { __op: 'Add', objects };
  }

  static addUnique(objects: unknown[]): IOperation {
    return { __op: 'AddUnique', objects };
  }

  static remove(objects: unknown[]): IOperation {
    return { __op: 'Remove', objects };
  }

  static bitAnd(value: unknown): IOperation {
    return { __op: 'BitAnd', value };
  }

  static bitOr(value: unknown): IOperation {
    return { __op: 'BitOr', value };
  }

  static bitXor(value: unknown): IOperation {
    return { __op: 'BitXor', value };
  }
}
