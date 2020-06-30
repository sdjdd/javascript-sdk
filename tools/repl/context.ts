import * as env from '../../env';
import {
  init,
  App,
  Storage,
  PlatformSupport,
  ACL,
  storage,
} from '../../src/core';
import { node } from '../../src/Node';

export { env, App, Storage, ACL, storage };

PlatformSupport.setPlatform(node);

init({
  name: 'REPL APP',
  appId: env.appId,
  appKey: env.appKey,
  serverURL: env.serverURL,
});

export { HTTPRequest } from '../../src/core/http';
export { ObjectReference } from '../../src/core/storage/ObjectReference';
