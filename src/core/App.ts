import { PlatformSupport, Platform } from './Platform';
import { HTTPRequest, HTTPResponse } from './http';
import { IAppInfo } from './types';

export const KEY_CURRENT_USER = 'current-user';

export class App {
  info: IAppInfo;
  platform: Platform;

  private _sessionToken: string;

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

  getSessionToken(): string {
    if (!this._sessionToken && typeof this._sessionToken !== 'string') {
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

  _request(req: HTTPRequest): Promise<HTTPResponse> {
    return this.platform.network.request(req);
  }

  async _requestToUluru(req: Partial<HTTPRequest>): Promise<HTTPResponse> {
    req.baseURL = this.info.serverURL;

    if (!req.header) {
      req.header = {};
    }
    req.header['X-LC-UA'] = this.platform.name;
    req.header['X-LC-Id'] = this.info.appId;
    req.header['X-LC-Key'] = this.info.appKey;
    req.header['Content-Type'] = 'application/json';

    const sessionToken = this.getSessionToken();
    if (sessionToken) {
      req.header['X-LC-Session'] = sessionToken;
    }

    const res = await this.platform.network.request(req as HTTPRequest);
    if (typeof res.body === 'string') {
      res.body = JSON.parse(res.body);
    }
    if (!/^2/.test(res.status.toString())) {
      const err = res.body as { code: number; error: string };
      throw new Error(`code: ${err.code}, message: ${err.error}`);
    }

    return res;
  }

  _kvSet(key: string, value: string): void {
    const platform = PlatformSupport.getPlatform();
    platform.storage.set(this.info.appId + ':' + key, value);
  }

  _kvGet(key: string): string {
    const platform = PlatformSupport.getPlatform();
    return platform.storage.get(this.info.appId + ':' + key);
  }
}
