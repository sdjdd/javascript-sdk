import { PlatformSupport } from './Platform';
import { HTTPRequest } from './http';
import { IAppInfo } from './types';

export class App {
  info: IAppInfo;
  sessionToken: string;

  constructor(config?: IAppInfo) {
    this.info = {
      appId: config?.appId,
      appKey: config?.appKey,
      serverURL: config?.serverURL,
    };
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
      query: {},
    };
  }
}
