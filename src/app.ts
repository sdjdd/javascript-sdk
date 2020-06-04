import { HttpClient } from './http-client';
import { LeanStorage } from './storage/storage';

export interface InitOptions {
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
  public _httpClient: HttpClient;

  private _appInfo: AppInfo;

  constructor(options: InitOptions) {
    this._appInfo = {
      appId: options.appId,
      appKey: options.appKey,
      serverURL: options.serverURL,
    };
    this._httpClient = new HttpClient(this._appInfo);
  }

  get id() {
    return this._appInfo.appId;
  }
  get key() {
    return this._appInfo.appKey;
  }
  get serverURL() {
    return this._appInfo.serverURL;
  }

  object(className: string) {
    return new LeanStorage(this, className);
  }
}
