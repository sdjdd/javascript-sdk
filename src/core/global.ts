import { App } from './App';
import { IAppInfo } from './types';

export const defaultApp = new App({
  appId: '',
  appKey: '',
  serverURL: '',
});

export function init(config: IAppInfo): void {
  defaultApp.info = config;
}
