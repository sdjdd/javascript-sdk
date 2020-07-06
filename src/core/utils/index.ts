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

export function walk(
  obj: unknown,
  handler: (value, key: string, item: unknown, items: unknown[]) => boolean
): void {
  const items = [obj];
  while (items.length > 0) {
    const item = items.shift();
    Object.entries(item).forEach(([key, value]) => {
      const goon = handler(value, key, item, items);
      if (goon && value !== null && typeof value === 'object') {
        items.push(value);
      }
    });
  }
}
