import * as env from '../../env';
import { App } from '../../src/Node';

export { env };

export const app = new App({
  appId: env.appId,
  appKey: env.appKey,
  serverURL: env.serverURL,
});
