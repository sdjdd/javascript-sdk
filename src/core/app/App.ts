import { Storage } from '../storage/Storage';
import { Platform } from '../../platform';
import { API } from './API';
import { UserClassReference } from '../user/UserClass';

export interface AppConfig {
  appId: string;
  appKey: string;
  serverURL: string;
  platform: Platform;
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
    this.api = new API(config.platform.network, this.info);
    this.platform = config.platform;
  }

  storage(): Storage {
    return new Storage(this.api);
  }

  user(): UserClassReference {
    return new UserClassReference(this.api);
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
}
