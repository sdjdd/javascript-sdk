import * as env from '../../env';
import { App, Storage, PlatformSupport } from '../../src/core';
import { node } from '../../src/node';

export { env };
export { App, Storage, ACL, Operation, Query, LCObject } from '../../src/core';

export { ObjectDecoder, ObjectEncoder } from '../../src/core/storage/encoding';

PlatformSupport.setPlatform(node);

export const app = new App({
  appId: env.appId,
  appKey: env.appKey,
  serverURL: env.serverURL,
});

export const db = new Storage(app);
