import { Storage } from './Storage';
import { Platform } from './Platform';
import { API } from './API';

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

  constructor(config: AppConfig) {
    this.info = {
      appId: config.appId,
      appKey: config.appKey,
      serverURL: config.serverURL,
    };
    this.name = config.name || '[DEFAULT]';
    this.api = new API(this.info);
  }

  get sessionToken(): string {
    return this.api.session;
  }
  set sessionToken(sessionToken: string) {
    this.api.session = sessionToken;
  }

  storage(): Storage {
    return new Storage(this.api);
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
}
