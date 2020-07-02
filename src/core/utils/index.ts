export * from './http';
export * from './api';

export function checkObjecTag(obj: unknown, name: string): boolean {
  return Object.prototype.toString.call(obj) === '[object ' + name + ']';
}

export function isDate(obj: unknown): boolean {
  return checkObjecTag(obj, 'Date');
}

export function isRegExp(obj: unknown): boolean {
  return checkObjecTag(obj, 'RegExp');
}
