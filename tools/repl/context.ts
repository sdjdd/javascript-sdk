import * as env from '../../env';
import { init, PlatformSupport } from '../../src/core';
import { node } from '../../src/Node';

export { env };
export {
  App,
  Storage,
  ACL,
  storage,
  Operation,
  User,
  Query,
} from '../../src/core';

PlatformSupport.setPlatform(node);

init({
  name: 'REPL APP',
  appId: env.appId,
  appKey: env.appKey,
  serverURL: env.serverURL,
});
