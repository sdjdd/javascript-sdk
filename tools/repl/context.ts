import * as env from '../../env';
import { App } from '../../src/app';
import { AVObject } from '../../src/AVObject';
import { Node as PlatformNode } from '../../src/platforms/Node';

import AV from '../../src/av';

export { env, AVObject, AV };

export const app = new App({
  appId: env.appId,
  appKey: env.appKey,
  serverURL: env.serverURL,
  platform: PlatformNode,
});
