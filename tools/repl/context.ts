import * as env from '../../env';
import { App, Storage, debug, Adapters } from '../../src/core';
import * as adapters from '@leancloud/platform-adapters-node';

export { env };
export {
  App,
  Storage,
  ACL,
  Operation,
  Query,
  LCObject,
  File,
  LiveQuery,
} from '../../src/core';

export {
  ObjectDecoder,
  ObjectEncoder,
} from '../../src/core/storage/ObjectEncoding';

debug.enable('LC*');

Adapters.set(adapters);

export const app = new App({
  appId: env.appId,
  appKey: env.appKey,
  serverURL: env.serverURL,
});

export const db = new Storage(app);
export const User = db.user();
export const Test = db.class('Test');
