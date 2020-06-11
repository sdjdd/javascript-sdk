import { AppInfo } from '../core/app';
import { HTTPClient } from '../core/http';

export interface Platform {
  createHTTPClient(appInfo: AppInfo): HTTPClient;
}
