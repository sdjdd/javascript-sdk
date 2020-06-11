import { Platform } from '..';
import { AppInfo } from '../../core/app';
import { HTTPClient } from '../../core/http';
import { NodeHTTPClient } from './HTTPClient';

export const Node: Platform = {
  createHTTPClient(appInfo: AppInfo): HTTPClient {
    return new NodeHTTPClient(appInfo);
  },
};
