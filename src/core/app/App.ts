import { HTTPClient } from './HTTPClient';
import { Storage } from '../storage/Storage';

export interface AppConfig {
  appId: string;
  appKey: string;
  serverURL: string;
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

  constructor(config: AppConfig, name?: string) {
    this.info = {
      appId: config.appId,
      appKey: config.appKey,
      serverURL: config.serverURL,
    };
    this.name = name || '[DEFAULT]';
  }

  storage(): Storage {
    return new Storage(this);
  }
}
