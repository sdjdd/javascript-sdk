import { App, AppConfig } from './app';

export const defaultApp = new App({
  appId: '',
  appKey: '',
  serverURL: '',
});

export function init(config: AppConfig): void {
  defaultApp.info = config;
}
