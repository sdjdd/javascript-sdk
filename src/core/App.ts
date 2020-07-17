import { PlatformSupport } from './Platform';
import { IAppInfo, IAuthOption } from './types';
import { log, HTTPRequest, fail } from './utils';
import {
  IPlatform,
  IHTTPResponse,
  IUploadRequest,
  IRequestOption,
} from '../adapters';
import { UluruError } from './errors';

export const KEY_CURRENT_USER = 'CURRENT_USER';
export const KEY_PUSH_ROUTER = 'PUSH_ROUTER';

export class App {
  info: IAppInfo;
  platform: IPlatform;

  private _cache = new Map<string, unknown>();
  private _sessionToken: string;
  private _useMasterKey: boolean;

  constructor(config: IAppInfo) {
    this.info = {
      appId: config?.appId,
      appKey: config?.appKey,
      serverURL: config?.serverURL,
    };
    this.platform = PlatformSupport.getPlatform();
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

  async _request(
    req: HTTPRequest,
    option?: IRequestOption
  ): Promise<IHTTPResponse> {
    log('LC:Request:send', '%O', req);
    const res = await this.platform.request(req, option);
    log('LC:Request:recv', '%O', res);
    return res;
  }

  async _uluru(req: HTTPRequest, option?: IAuthOption): Promise<IHTTPResponse> {
    req.baseURL = this.info.serverURL;
    req.header['Content-Type'] = 'application/json';
    req.header['X-LC-UA'] = this.platform.userAgent || 'unknown';
    req.header['X-LC-Id'] = this.info.appId;

    let useMasterKey: boolean;
    if (option?.useMasterKey !== undefined) {
      useMasterKey = option.useMasterKey;
    } else {
      useMasterKey = this._useMasterKey;
    }
    if (useMasterKey) {
      if (!this.info.masterKey) {
        fail('The masterKey is not provided');
      }
      req.header['X-LC-Key'] = this.info.masterKey + ',master';
    } else {
      req.header['X-LC-Key'] = this.info.appKey;
    }

    const sessionToken = option?.sessionToken || this.getSessionToken();
    if (sessionToken) {
      req.header['X-LC-Session'] = sessionToken;
    }

    const res = await this._request(req, option);
    if (typeof res.body === 'string') {
      res.body = JSON.parse(res.body);
    }
    if (!/^2/.test(res.status.toString())) {
      const err = res.body as { code: number; error: string };
      throw new UluruError(err.code, err.error);
    }
    return res;
  }

  _upload(
    req: IUploadRequest,
    option?: IRequestOption
  ): Promise<IHTTPResponse> {
    log('LC:Upload', '%O', req);
    return this.platform.upload(req, option);
  }

  _kvSet(key: string, value: string): void {
    log('LC:KV:set', '%s = %O', key, value);
    this.platform.storage.set(this.info.appId + ':' + key, value);
  }

  _kvGet(key: string): string {
    const value = this.platform.storage.get(this.info.appId + ':' + key);
    log('LC:KV:get', '%s = %O', key, value);
    return value;
  }

  _kvRemove(key: string): void {
    log('LC:KV:rm', key);
    this.platform.storage.remove(this.info.appId + ':' + key);
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
