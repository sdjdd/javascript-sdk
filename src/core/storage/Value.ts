export interface Operation {
  __op: string;
  [key: string]: unknown;
}

export class Value {
  static delete(): Operation {
    return { __op: 'Delete' };
  }

  static increment(amount: number): Operation {
    return { __op: 'Increment', amount };
  }

  static decrement(amount: number): Operation {
    return { __op: 'Decrement', amount };
  }

  static add(objects: unknown[]): Operation {
    return { __op: 'Add', objects };
  }

  static addUnique(objects: unknown[]): Operation {
    return { __op: 'AddUnique', objects };
  }

  static remove(objects: unknown[]): Operation {
    return { __op: 'Remove', objects };
  }
}
