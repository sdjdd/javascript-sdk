import * as env from '../../env';
import { App } from '../../src/Node';
import { AVObject } from '../../src/core/AVObject';
import { IncrementOperation, DeleteOperation } from '../../src/core/operations';

export { env, AVObject, IncrementOperation, DeleteOperation };

export const app = new App({
  appId: env.appId,
  appKey: env.appKey,
  serverURL: env.serverURL,
});
