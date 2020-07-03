import { PlatformSupport } from './Platform';
import { HTTPRequest } from './http';
import { defaultApp } from './global';

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

  static get default(): App {
    return defaultApp;
  }

  constructor(config?: AppConfig) {
    this.info = {
      appId: config?.appId,
      appKey: config?.appKey,
      serverURL: config?.serverURL,
    };
    this.name = config?.name || '[DEFAULT]';
  }

  get initialized(): boolean {
    if (this.info.appId && this.info.appKey) {
      return true;
    }
    return false;
  }

  _makeBaseRequest(method: string, path: string): HTTPRequest {
    const platform = PlatformSupport.getPlatform();
    return {
      method,
      path,
      baseURL: this.info.serverURL,
      header: {
        'X-LC-UA': platform.name,
        'X-LC-Id': this.info.appId,
        'X-LC-Key': this.info.appKey,
        'Content-Type': 'application/json',
      },
    };
  }
}
