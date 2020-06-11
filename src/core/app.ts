import { HTTPClient } from './http';

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
  public _client: HTTPClient;

  private _info: AppInfo;

  constructor(options: InitOptions) {
    this._info = {
      appId: options.appId,
      appKey: options.appKey,
      serverURL: options.serverURL,
    };
  }

  get info(): AppInfo {
    return this._info;
  }
  get id(): string {
    return this._info.appId;
  }
  get key(): string {
    return this._info.appKey;
  }
  get serverURL(): string {
    return this._info.serverURL;
  }
}
