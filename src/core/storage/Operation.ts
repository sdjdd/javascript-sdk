export interface OperationRepresentation {
  __op: string;
  [key: string]: unknown;
}

export class Operation {
  static delete(): OperationRepresentation {
    return { __op: 'Delete' };
  }

  static increment(amount = 1): OperationRepresentation {
    return { __op: 'Increment', amount };
  }

  static decrement(amount = 1): OperationRepresentation {
    return { __op: 'Decrement', amount };
  }

  static add(objects: unknown[]): OperationRepresentation {
    return { __op: 'Add', objects };
  }

  static addUnique(objects: unknown[]): OperationRepresentation {
    return { __op: 'AddUnique', objects };
  }

  static remove(objects: unknown[]): OperationRepresentation {
    return { __op: 'Remove', objects };
  }
}
