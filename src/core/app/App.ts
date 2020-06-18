import { HTTPClient } from './HTTPClient';
import { Storage } from '../storage/Storage';
import { Platform } from '../Platform';
import { API } from './API';

export interface AppConfig {
  appId: string;
  appKey: string;
  serverURL: string;
  platform: Platform;
}

export interface AppInfo {
  appId: string;
  appKey: string;
  serverURL: string;
}

export class App {
  name: string;
  client: HTTPClient;
  info: AppInfo;
  platform: Platform;
  api: API;

  constructor(config: AppConfig, name?: string) {
    this.info = {
      appId: config.appId,
      appKey: config.appKey,
      serverURL: config.serverURL,
    };
    this.name = name || '[DEFAULT]';
    this.client = new HTTPClient(config.platform.request);
    this.api = new API(config.platform.request, this.info);
    this.platform = config.platform;
  }

  storage(): Storage {
    return new Storage(this.api);
  }
}
