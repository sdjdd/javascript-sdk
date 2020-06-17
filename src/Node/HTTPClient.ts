import { HTTPClient } from '../core/app/HTTPClient';
import got, { Method, HTTPError, Response as GotResponse } from 'got';
import { Header, Body, Response } from '../core/app/HTTPClient';
import { AppInfo } from '../core/app/app';
import { RESTAPIError } from '../core/errors';

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
    })
      .then(function (res) {
        return {
          headers: res.headers as Header,
          body: res.body as Body,
        };
      })
      .catch(function (err: HTTPError) {
        const res = err.response as GotResponse<RESTAPIError>;
        throw new Error(res.body.error);
      });
  }
}
