export interface AdvancedType {
  __type: string;
}

export function isAdvancedType(obj: unknown): boolean {
  if (obj && typeof obj === 'object') {
    return '__type' in obj;
  }
  return false;
}
