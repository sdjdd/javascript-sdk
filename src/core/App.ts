import { IAppInfo, IAuthOption } from './types';
import { log, fail } from './utils';
import { UluruError } from './errors';
import { Adapters, IHTTPRequest, IHTTPResponse } from './Adapters';

export const KEY_CURRENT_USER = 'CURRENT_USER';
export const KEY_PUSH_ROUTER = 'PUSH_ROUTER';

export class App {
  info: IAppInfo;

  private _cache = new Map<string, unknown>();
  private _sessionToken: string;
  private _useMasterKey: boolean;

  constructor(config: IAppInfo) {
    this.info = {
      appId: config?.appId,
      appKey: config?.appKey,
      serverURL: config?.serverURL,
    };
  }

  get initialized(): boolean {
    if (this.info.appId && this.info.appKey) {
      return true;
    }
    return false;
  }

  useMasterKey(enable: boolean): void {
    if (enable && !this.info.masterKey) {
      fail('The masterKey is not provided');
    }
    this._useMasterKey = enable;
  }

  getSessionToken(): string {
    if (!this._sessionToken) {
      const userStr = this._kvGet(KEY_CURRENT_USER);
      if (userStr) {
        const userData = JSON.parse(userStr);
        this._sessionToken = userData.sessionToken;
      }
    }
    return this._sessionToken || null;
  }

  setSessionToken(sessionToken: string): void {
    this._sessionToken = sessionToken;
  }

  async _uluru(
    req: IHTTPRequest,
    option?: IAuthOption
  ): Promise<IHTTPResponse> {
    const { userAgent = 'unknown' } = Adapters.get().platformInfo;

    req.baseURL = this.info.serverURL;
    if (!req.header) req.header = {};
    req.header['Content-Type'] = 'application/json';
    req.header['X-LC-UA'] = userAgent;
    req.header['X-LC-Id'] = this.info.appId;

    let useMasterKey: boolean;
    if (option?.useMasterKey !== undefined) {
      useMasterKey = option.useMasterKey;
    } else {
      useMasterKey = this._useMasterKey;
    }
    if (useMasterKey) {
      if (!this.info.masterKey) {
        throw new Error('The masterKey is not defined');
      }
      req.header['X-LC-Key'] = this.info.masterKey + ',master';
    } else {
      req.header['X-LC-Key'] = this.info.appKey;
    }

    const sessionToken = option?.sessionToken || this.getSessionToken();
    if (sessionToken) {
      req.header['X-LC-Session'] = sessionToken;
    }

    const res = await Adapters.request(req, option);
    if (!/^2/.test(res.status.toString())) {
      const err = res.body as { code: number; error: string };
      throw new UluruError(err.code, err.error);
    }
    return res;
  }

  _kvSet(key: string, value: string): void {
    key = this.info.appId + ':' + key;
    log('LC:KV:set', '%s = %O', key, value);
    Adapters.get().storage.setItem(key, value);
  }

  _kvGet(key: string): string {
    key = this.info.appId + ':' + key;
    const value = Adapters.get().storage.getItem(key) as string;
    log('LC:KV:get', '%s = %O', key, value);
    return value;
  }

  _kvRemove(key: string): void {
    log('LC:KV:rm', key);
    key = this.info.appId + ':' + key;
    Adapters.get().storage.removeItem(key);
  }

  _cacheSet(key: string, value: unknown): void {
    log('LC:Cache:set', '%s = %o', key, value);
    this._cache.set(key, value);
  }

  _cacheGet(key: string): unknown {
    const value = this._cache.get(key);
    log('LC:Cache:get', '%s = %o', key, value);
    return value;
  }

  _cacheRemove(key: string): void {
    log('LC:Cache:rm', key);
    this._cache.delete(key);
  }
}
