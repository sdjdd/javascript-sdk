import got, { Method } from 'got';
import { AppInfo } from '../app';

type Header = Record<string, string>;
type Body = Record<string, string>;

export interface Response {
  headers: Header;
  body: Body;
}

export class HttpClient {
  public headers: Header = {};
  public baseURL = '';

  constructor(appInfo?: AppInfo) {
    if (appInfo) {
      this.setHeader('X-LC-Id', appInfo.appId);
      this.setHeader('X-LC-Key', appInfo.appKey);
      this.baseURL = appInfo.serverURL;
    }
  }

  setHeader(key: string, value: string): this {
    this.headers[key] = value;
    return this;
  }

  request(method: string, url: string, data?: Body): Promise<Response> {
    return got(this.baseURL + url, {
      method: method as Method,
      headers: this.headers,
      json: data,
      responseType: 'json',
    }).then(function (res) {
      return {
        headers: res.headers as Header,
        body: res.body as Body,
      };
    });
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
