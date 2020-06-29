import { AppInfo } from './app';
import { Network } from './Platform';
import { HTTPRequest } from './http';

const API_VERSION = '1.1';

export interface RESTAPIError {
  code: number;
  error: string;
}

export class API {
  session: string;
  network: Network;
  userAgent: string;

  constructor(public appInfo: AppInfo) {}

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

    const res = await this.network.request(new HTTPRequest());
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
    const path = `/${API_VERSION}/classes/${className}`;
    const res = await this.lcRequest('POST', path, data);
    return res.objectId as string;
  }

  async getObject(
    className: string,
    objectId: string
  ): Promise<Record<string, unknown>> {
    const path = `/${API_VERSION}/classes/${className}/${objectId}`;
    const res = await this.lcRequest('GET', path);
    return res;
  }

  async updateObject(
    className: string,
    objectId: string,
    data: Record<string, unknown>
  ): Promise<void> {
    const path = `/${API_VERSION}/classes/${className}/${objectId}`;
    await this.lcRequest('PUT', path, data);
  }

  async deleteObject(className: string, objectId: string): Promise<void> {
    const path = `/${API_VERSION}/classes/${className}/${objectId}`;
    await this.lcRequest('DELETE', path);
  }

  async getFileTokens(
    key: string,
    name: string,
    options: {
      mime?: string;
      keepFileName?: boolean;
    } = {}
  ): Promise<Record<string, string>> {
    const path = `/${API_VERSION}/fileTokens`;
    const res = await this.lcRequest('POST', path, {
      key,
      name,
      ACL: undefined,
      mime_type: options.mime,
      keep_file_name: options.keepFileName,
      metaData: undefined, // metaData is not necessary
    });
    return res as Record<string, string>;
    /*
    {
      objectId: '5ef16e742056320008aeb45c',
      createdAt: '2020-06-23T02:52:36.012Z',
      token: 'w6ZYeC-arS2makzcotrVJGjQvpsCQeHcPseFRDzJ:yYJN52q2y6qQ6AlpWDW6defJ5iQ=:eyJpbnNlcnRPbmx5IjoxLCJzY29wZSI6Im9ZMmFxU3hoIiwibWltZUxpbWl0IjoiISIsImRlYWRsaW5lIjoxNTkyODg0MzU2fQ==',
      url: 'http://xxxxxx.cn-n1.lcfile.com/54d52c30-a3bd-4862-af38-96ae8c6bf36a.txt',
      mime_type: 'text/plain',
      provider: 'qiniu',
      upload_url: 'https://upload.qiniup.com',
      bucket: 'oY2aqSxh',
      key: '54d52c30-a3bd-4862-af38-96ae8c6bf36a.txt'
    }
    */
  }

  handleFileCallback(
    token: string,
    result = true
  ): Promise<Record<string, unknown>> {
    const path = `/${API_VERSION}/fileCallback`;
    return this.lcRequest('POST', path, { token, result });
  }

  userSignUp(userInfo: {
    username: string;
    password: string;
    email?: string;
    mobilePhoneNumber?: string;
  }): Promise<Record<string, unknown>> {
    const path = `/${API_VERSION}/users`;
    return this.lcRequest('POST', path, userInfo);
  }

  async userLogin(
    username: string,
    password: string
  ): Promise<Record<string, unknown>> {
    const path = `/${API_VERSION}/login`;
    const res = await this.lcRequest('POST', path, {
      username,
      password,
    });
    this.session = res.sessionToken as string;
    return res;
  }
}
