import { HttpClient } from './http-client';

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

  get id(): string {
    return this._appInfo.appId;
  }
  get key(): string {
    return this._appInfo.appKey;
  }
  get serverURL(): string {
    return this._appInfo.serverURL;
  }
}
