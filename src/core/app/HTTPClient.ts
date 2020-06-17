import { AppInfo } from './App';

export type Header = Record<string, string>;
export type Body = Record<string, unknown>;

export interface Response {
  headers: Header;
  body: Body;
}

export abstract class HTTPClient {
  headers: Header = {};
  baseURL = '';

  constructor(appInfo?: AppInfo) {
    if (appInfo) {
      this.setHeader('X-LC-Id', appInfo.appId);
      this.setHeader('X-LC-Key', appInfo.appKey);
      this.baseURL = appInfo.serverURL;
    }
  }

  abstract request(method: string, url: string, data?: Body): Promise<Response>;

  setHeader(key: string, value: string): this {
    this.headers[key] = value;
    return this;
  }

  get(url: string): Promise<Response> {
    return this.request('GET', url);
  }

  put(url: string, data?: Body): Promise<Response> {
    return this.request('PUT', url, data);
  }

  post(url: string, data?: Body): Promise<Response> {
    return this.request('POST', url, data);
  }

  delete(url: string, data?: Body): Promise<Response> {
    return this.request('DELETE', url, data);
  }
}
