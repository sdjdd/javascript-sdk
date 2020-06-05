import got, { Method } from 'got';
import { AppInfo } from '../app';

export interface Response {
  headers: { [key: string]: string };
  body: any;
}

export default class HttpClient {
  public headers: { [key: string]: string } = {};

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

  request(method: string, url: string, data?: any): Promise<Response> {
    return got(this.baseURL + url, {
      method: method as Method,
      headers: this.headers,
      json: data,
      responseType: 'json',
    }).then(function (res) {
      return {
        headers: res.headers as { [key: string]: string },
        body: res.body as any,
      };
    });
  }

  get(url: string): Promise<Response> {
    return this.request('GET', url);
  }

  put(url: string, data?: any): Promise<Response> {
    return this.request('PUT', url, data);
  }

  post(url: string, data?: any): Promise<Response> {
    return this.request('POST', url, data);
  }

  delete(url: string, data?: any): Promise<Response> {
    return this.request('DELETE', url, data);
  }
}
