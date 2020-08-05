export class ObjectUtils {
  static deleteKey(obj: unknown, key: string): void {
    if (!obj) return;
    if (key.includes('.')) {
      const keys = key.split('.');
      ObjectUtils.deleteKey(obj[keys[0]], keys.slice(1).join('.'));
    } else {
      delete obj[key];
    }
  }

  static isEmpty(obj: unknown): boolean {
    if (!obj) return true;
    return Object.keys(obj).length === 0;
  }
}
