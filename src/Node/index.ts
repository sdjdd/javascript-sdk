import { App as CoreApp, AppConfig } from '../core';
import { NodeHTTPClient } from './HTTPClient';

export * from '../core';
export class App extends CoreApp {
  constructor(options: AppConfig) {
    super(options);
    this.client = new NodeHTTPClient(this.info);
  }
}
