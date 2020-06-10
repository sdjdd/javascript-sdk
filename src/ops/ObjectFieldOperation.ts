export interface ObjectFieldOperation {
  operation: string;
  field: string;
  value: unknown;

  apply(obj: unknown): unknown;
  merge(previous: ObjectFieldOperation): ObjectFieldOperation;
}
