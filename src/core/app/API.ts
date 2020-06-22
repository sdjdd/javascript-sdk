import { AppInfo } from './app';
import { Network } from '../../platform/Network';

export interface RESTAPIError {
  code: number;
  error: string;
}

export class API {
  session: string;

  constructor(
    public network: Network,
    public appInfo: AppInfo,
    public userAgent?: string
  ) {}

  async lcRequest(
    method: string,
    path: string,
    data?: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const headers: Record<string, string> = {
      'X-LC-UA': this.userAgent || 'unknown',
      'X-LC-Id': this.appInfo.appId,
      'X-LC-Key': this.appInfo.appKey,
      'Content-Type': 'application/json',
    };
    if (this.session !== undefined) {
      headers['X-LC-Session'] = this.session;
    }

    const res = await this.network.request(
      method,
      this.appInfo.serverURL + path,
      headers,
      data
    );
    if (Math.floor(res.status / 100) !== 2) {
      throw new Error(res.body as string);
    }

    if (typeof res.body === 'string') {
      return JSON.parse(res.body);
    }
    return res.body as Record<string, unknown>;
  }

  async createObject(
    className: string,
    data: Record<string, unknown>
  ): Promise<string> {
    const path = `/1.1/classes/${className}`;
    const res = await this.lcRequest('POST', path, data);
    return res.objectId as string;
  }

  async getObject(
    className: string,
    objectId: string
  ): Promise<Record<string, unknown>> {
    const path = `/1.1/classes/${className}/${objectId}`;
    const res = await this.lcRequest('GET', path);
    return res;
  }

  async updateObject(
    className: string,
    objectId: string,
    data: Record<string, unknown>
  ): Promise<void> {
    const path = `/1.1/classes/${className}/${objectId}`;
    await this.lcRequest('PUT', path, data);
  }

  async deleteObject(className: string, objectId: string): Promise<void> {
    const path = `/1.1/classes/${className}/${objectId}`;
    await this.lcRequest('DELETE', path);
  }

  async requestFileToken(
    key: string,
    name: string,
    options: {
      mime?: string;
      keepFileName?: boolean;
    } = {}
  ): Promise<Record<string, string>> {
    const path = `/1.1/fileTokens`;
    const res = await this.lcRequest('POST', path, {
      key,
      name,
      ACL: undefined,
      mime_type: options.mime,
      keep_file_name: options.keepFileName,
      metaData: undefined, // metaData is not necessary
    });
    return res as Record<string, string>;
  }

  async userLogin(
    username: string,
    password: string
  ): Promise<Record<string, unknown>> {
    const path = `/1.1/login`;
    const res = await this.lcRequest('POST', path, {
      username,
      password,
    });
    this.session = res.sessionToken as string;
    return res;
  }
}
