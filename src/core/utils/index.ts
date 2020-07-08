export * from './http';

const RESERVED_KEYS = new Set(['objectId', 'createdAt', 'updatedAt']);

export function checkObjectTag(obj: unknown, name: string): boolean {
  return Object.prototype.toString.call(obj) === '[object ' + name + ']';
}

export function isDate(obj: unknown): boolean {
  return checkObjectTag(obj, 'Date');
}

export function isRegExp(obj: unknown): boolean {
  return checkObjectTag(obj, 'RegExp');
}

export function assert(cond: unknown, msg: string): void {
  if (!cond) {
    throw new Error(msg);
  }
}

export function removeReservedKeys(obj: Record<string, unknown>): void {
  Object.keys(obj).forEach((key) => {
    if (RESERVED_KEYS.has(key)) {
      delete obj[key];
    }
  });
}
