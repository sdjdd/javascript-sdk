export * from './http';

export function checkObjectTag(obj: unknown, name: string): boolean {
  return Object.prototype.toString.call(obj) === '[object ' + name + ']';
}

export function isDate(obj: unknown): boolean {
  return checkObjectTag(obj, 'Date');
}

export function isRegExp(obj: unknown): boolean {
  return checkObjectTag(obj, 'RegExp');
}
