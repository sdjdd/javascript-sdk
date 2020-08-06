import { IApp } from './types';
import { Adapters } from './Adapters';

export const KEY_CURRENT_USER = 'CURRENT_USER';
export const KEY_PUSH_ROUTER = 'PUSH_ROUTER';
export const KEY_SESSION_TOKEN = 'SESSION_TOKEN';

type CacheKey = string | symbol;
type AppCache = Map<CacheKey, unknown>;

export class Cache {
  private static appCache = new Map<string, AppCache>();

  private static for(app: IApp): AppCache {
    if (!Cache.appCache.has(app.appId)) {
      Cache.appCache.set(app.appId, new Map<string, unknown>());
    }
    return Cache.appCache.get(app.appId);
  }

  static get(app: IApp, key: CacheKey, readFromKV = false): unknown {
    if (readFromKV && typeof key === 'symbol') {
      throw new Error('Cannot use symbol key when read from kv storage');
    }
    let value = Cache.for(app).get(key);
    if (!value && readFromKV) {
      value = Adapters.kvGet(key as string, app.appId);
    }
    return value;
  }

  static set(app: IApp, key: CacheKey, value: unknown, syncToKV = false): void {
    Cache.for(app).set(key, value);
    if (syncToKV) {
      if (typeof key === 'symbol') {
        throw new Error('Cannot use symbol key when sync to kv storage');
      }
      if (typeof value !== 'string') {
        throw new Error('Only string value can be set to kv storage');
      }
      Adapters.kvSet(key, value, app.appId);
    }
  }

  static delete(app: IApp, key: CacheKey, syncToKV = false): void {
    Cache.for(app).delete(key);
    if (syncToKV) {
      if (typeof key === 'symbol') {
        throw new Error(
          'Cannot delete value from kv storage when key is symbol'
        );
      }
      Adapters.kvRemove(key, app.appId);
    }
  }
}
