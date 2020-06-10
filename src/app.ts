import { HTTPClient } from './http';
import { AVObject } from './storage/object';
import { Platform } from './platforms';

export interface InitOptions {
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
  public _client: HTTPClient;

  private _info: AppInfo;

  constructor(options: InitOptions) {
    this._info = {
      appId: options.appId,
      appKey: options.appKey,
      serverURL: options.serverURL,
    };
    this._client = options.platform.createHTTPClient(this._info);
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

  object(className: string): AVObject {
    return new AVObject({
      className,
      httpClient: this._client,
    });
  }
}
