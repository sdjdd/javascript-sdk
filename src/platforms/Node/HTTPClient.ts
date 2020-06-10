import { HTTPClient } from '../../http/HTTPClient';
import got, { Method } from 'got';
import { Header, Body, Response } from '../../http/HTTPClient';

export class NodeHTTPClient extends HTTPClient {
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
