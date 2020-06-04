import got, { Method } from 'got';
import { AppInfo, App } from '../app';

export class HttpClient {
  public headers: { [key: string]: string } = {};
  public baseURL: string = '';

  constructor(appInfo?: AppInfo) {
    if (appInfo) {
      this.setHeader('X-LC-Id', appInfo.appId);
      this.setHeader('X-LC-Key', appInfo.appKey);
      this.baseURL = appInfo.serverURL;
    }
  }

  setHeader(key: string, value: string) {
    this.headers[key] = value;
    return this;
  }

  request(method: string, url: string, data?: any) {
    return got(this.baseURL + url, {
      method: method as Method,
      headers: this.headers,
      json: data,
      responseType: 'json',
    }).then(function (res) {
      return {
        headers: res.headers,
        body: res.body as any,
      };
    });
  }

  get(url: string) {
    return this.request('GET', url);
  }

  put(url: string, data?: any) {
    return this.request('PUT', url, data);
  }

  post(url: string, data?: any) {
    return this.request('POST', url, data);
  }

  delete(url: string, data?: any) {
    return this.request('DELETE', url, data);
  }
}
