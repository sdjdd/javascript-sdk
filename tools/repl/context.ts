import * as env from '../../env';
import { init, PlatformSupport } from '../../src/core';
import { node } from '../../src/Node';

export { env };
export {
  App,
  app,
  Storage,
  ACL,
  storage,
  Operation,
  Query,
  LCObject,
} from '../../src/core';

export { ObjectDecoder, ObjectEncoder } from '../../src/core/storage/encoding';

PlatformSupport.setPlatform(node);

init({
  appId: env.appId,
  appKey: env.appKey,
  serverURL: env.serverURL,
});
