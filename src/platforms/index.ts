import { AppInfo } from '../app';
import { HTTPClient } from '../http';

export interface Platform {
  createHTTPClient(appInfo: AppInfo): HTTPClient;
}
