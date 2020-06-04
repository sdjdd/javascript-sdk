import * as env from '../../env';
import { AVObject } from '../../src/storage/object';
import { App } from '../../src/app';

import AV from '../../src/av';

export { env, AVObject, AV };

export const app = new App({
  appId: env.appId,
  appKey: env.appKey,
  serverURL: env.serverURL,
});
