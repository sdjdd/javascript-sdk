import { Platform } from '..';
import { AppInfo } from '../../app';
import { HTTPClient } from '../../http';
import { NodeHTTPClient } from './HTTPClient';

export const Node: Platform = {
  createHTTPClient(appInfo: AppInfo): HTTPClient {
    return new NodeHTTPClient(appInfo);
  },
};
