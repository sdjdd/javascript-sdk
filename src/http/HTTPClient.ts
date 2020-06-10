import { AppInfo } from '../app';
import { KEY_OBJECT_ID } from '../AVObject';

const PATH_CLASSES = '/1.1/classes';

export type Header = Record<string, string>;
export type Body = Record<string, unknown>;

export interface Response {
  headers: Header;
  body: Body;
}

export abstract class HTTPClient {
  public headers: Header = {};
  public baseURL = '';

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

  async createObject(
    className: string,
    data: Record<string, unknown>,
    fetchWhenSave = false
  ): Promise<Record<string, unknown>> {
    let path = PATH_CLASSES + '/' + className;
    if (fetchWhenSave) {
      path += '?fetchWhenSave=true';
    }
    const { body } = await this.post(path, data);
    return body;
  }

  async updateObject(
    className: string,
    data: Record<string, unknown>,
    fetchWhenSave = false
  ): Promise<Record<string, unknown>> {
    let path = PATH_CLASSES + '/' + className + '/' + data[KEY_OBJECT_ID];
    if (fetchWhenSave) {
      path += '?fetchWhenSave=true';
    }
    const { body } = await this.put(path, data);
    return body;
  }

  async getObject(
    className: string,
    objectId: string
  ): Promise<Record<string, unknown>> {
    const path = PATH_CLASSES + '/' + className + '/' + objectId;
    const { body } = await this.get(path);
    return body;
  }
}
