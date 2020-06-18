import { Request } from '../Platform';

export class HTTPClient {
  headers: Record<string, string> = {};
  baseURL = '';

  constructor(private _request: Request) {
    // if (appInfo) {
    //   this.setHeader('X-LC-Id', appInfo.appId);
    //   this.setHeader('X-LC-Key', appInfo.appKey);
    //   this.baseURL = appInfo.serverURL;
    // }
  }

  request(method: string, url: string, data?: unknown): Promise<unknown> {
    return this._request(method, url, this.headers, data);
  }

  setHeader(key: string, value: string): this {
    this.headers[key] = value;
    return this;
  }

  get(url: string): Promise<unknown> {
    return this.request('GET', url);
  }

  put(url: string, data?: unknown): Promise<unknown> {
    return this.request('PUT', url, data);
  }

  post(url: string, data?: unknown): Promise<unknown> {
    return this.request('POST', url, data);
  }

  delete(url: string, data?: unknown): Promise<unknown> {
    return this.request('DELETE', url, data);
  }
}
