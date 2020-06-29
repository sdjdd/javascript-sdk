import { Storage } from './Storage';
import { Platform } from './Platform';
import { API } from './API';
import { HTTPRequest } from './http';
import * as utils from '../utils';
import { Env } from './Env';

export interface AppConfig {
  appId: string;
  appKey: string;
  serverURL: string;
  name?: string;
}

export interface AppInfo {
  appId: string;
  appKey: string;
  serverURL: string;
}

export class App {
  static default: App;

  name: string;
  info: AppInfo;
  platform: Platform;
  api: API;

  static init(config: AppConfig): void {
    Env.setDefaultApp(new App(config));
  }

  constructor(config: AppConfig) {
    this.info = {
      appId: config.appId,
      appKey: config.appKey,
      serverURL: config.serverURL,
    };
    this.name = config.name || '[DEFAULT]';
    this.api = new API(this.info);
    this.platform = Env.getPlatform();
  }

  get sessionToken(): string {
    return this.api.session;
  }
  set sessionToken(sessionToken: string) {
    this.api.session = sessionToken;
  }

  signUp(userInfo: {
    username: string;
    password: string;
    email?: string;
    mobilePhoneNumber?: string;
  }): Promise<Record<string, unknown>> {
    return this.api.userSignUp(userInfo);
  }

  login(options: {
    username?: string;
    password?: string;
  }): Promise<Record<string, unknown>> {
    if (options.username !== undefined && options.password !== undefined) {
      return this.api.userLogin(options.username, options.password);
    }
    throw new TypeError('invalid login options');
  }

  logout(): void {
    delete this.api.session;
  }

  async _doRequest(req: HTTPRequest): Promise<Record<string, unknown>> {
    req.baseURL = this.info.serverURL;
    req.header['X-LC-UA'] = this.platform.name;
    req.header['X-LC-Id'] = this.info.appId;
    req.header['X-LC-Key'] = this.info.appKey;
    req.header['Content-Type'] = 'application/json';

    const res = await this.platform.network.request(req);
    if (utils.httpStatusNotOK(res.status)) {
      throw new Error(res.body as string);
    }
    return res.body as Record<string, unknown>;
  }
}
