import { App as CoreApp, InitOptions } from '../core';
import { NodeHTTPClient } from './HTTPClient';

export * from '../core';
export class App extends CoreApp {
  constructor(options: InitOptions) {
    super(options);
    this._client = new NodeHTTPClient(this.info);
  }
}
