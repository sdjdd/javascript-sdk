import * as env from '../../env';
import { App } from '../../src/core/app';
import { AVObject } from '../../src/core/AVObject';
import { Node as PlatformNode } from '../../src/platforms/Node';
import { IncrementOperation, DeleteOperation } from '../../src/core/operations';

import AV from '../../src/core/av';

export { env, AVObject, AV, IncrementOperation, DeleteOperation };

export const app = new App({
  appId: env.appId,
  appKey: env.appKey,
  serverURL: env.serverURL,
  platform: PlatformNode,
});
