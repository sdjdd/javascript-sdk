import { HTTPClient } from '../core/http/HTTPClient';
import got, { Method } from 'got';
import { Header, Body, Response } from '../core/http/HTTPClient';
import { AppInfo } from '../core/app';

export class NodeHTTPClient extends HTTPClient {
  constructor(appInfo?: AppInfo) {
    super(appInfo);
    this.setHeader('X-LC-UA', 'Node.js');
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
}
