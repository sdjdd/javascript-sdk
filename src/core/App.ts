import { Storage } from './Storage';
import { Platform } from './Platform';
import { API } from './API';
import { HTTPRequest } from './http';

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
  name: string;
  info: AppInfo;
  platform: Platform;
  api: API;
  storage: Storage;
  requests: HTTPRequest[] = [];

  constructor(config: AppConfig) {
    this.info = {
      appId: config.appId,
      appKey: config.appKey,
      serverURL: config.serverURL,
    };
    this.name = config.name || '[DEFAULT]';
    this.api = new API(this.info);
    this.storage = new Storage(this.api);
    this.storage.app = this;
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

  _setRequestHeader(request: HTTPRequest): void {
    request.header['X-LC-UA'] = this.platform.name;
    request.header['X-LC-Id'] = this.info.appId;
    request.header['X-LC-Key'] = this.info.appKey;
    request.header['Content-Type'] = 'application/json';
  }

  _pushRequest(request: HTTPRequest): void {
    this._setRequestHeader(request);
    this.requests.push(request);
  }
}
