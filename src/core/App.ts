import { PlatformSupport } from './Platform';
import { IAppInfo, IAuthOption } from './types';
import { log, UluruError, HTTPRequest } from './utils';
import { IPlatform, IHTTPResponse } from '../adapters';

export const KEY_CURRENT_USER = 'current-user';

export class App {
  info: IAppInfo;
  platform: IPlatform;

  private _sessionToken: string;
  private _useMasterKey: boolean;

  constructor(config?: IAppInfo) {
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
      throw new Error('The masterKey is not provided');
    }
    this._useMasterKey = enable;
  }

  getSessionToken(): string {
    if (!this._sessionToken && this._sessionToken !== '') {
      const userStr = this._kvGet(KEY_CURRENT_USER);
      if (userStr) {
        const user = JSON.parse(userStr);
        this._sessionToken = user.sessionToken;
      } else {
        this._sessionToken = '';
      }
    }
    return this._sessionToken;
  }

  setSessionToken(sessionToken: string): void {
    this._sessionToken = sessionToken;
  }

  async _request(req: HTTPRequest): Promise<IHTTPResponse> {
    log('LC:Request:send', '%O', req);
    const res = await this.platform.request(req);
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
        throw new Error('The masterKey is not provided');
      }
      req.header['X-LC-Key'] = this.info.masterKey + ',master';
    } else {
      req.header['X-LC-Key'] = this.info.appKey;
    }

    const sessionToken = option?.sessionToken || this.getSessionToken();
    if (sessionToken) {
      req.header['X-LC-Session'] = sessionToken;
    }

    const res = await this._request(req);
    if (typeof res.body === 'string') {
      res.body = JSON.parse(res.body);
    }
    if (!/^2/.test(res.status.toString())) {
      const err = res.body as { code: number; error: string };
      throw new UluruError(err.code, err.error);
    }
    return res;
  }

  _kvSet(key: string, value: string): void {
    log('LC:KV:set', '%s = %s', key, value);
    this.platform.storage.set(this.info.appId + ':' + key, value);
  }

  _kvGet(key: string): string {
    const value = this.platform.storage.get(this.info.appId + ':' + key);
    log('LC:KV:get', '%s = %s', key, value);
    return value;
  }

  _kvRemove(key: string): void {
    log('LC:KV:rm', key);
    this.platform.storage.remove(this.info.appId + ':' + key);
  }
}
