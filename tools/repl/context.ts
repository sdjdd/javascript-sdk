import * as env from '../../env';
import * as LC from '../../src/core';
import { node } from '../../src/Node';

export { env, LC };

LC.setPlatform(node);

export const app = new LC.App({
  name: 'REPL APP',
  appId: env.appId,
  appKey: env.appKey,
  serverURL: env.serverURL,
});

export const db = app.storage();

export const Test = db.Class('Test');
export const Todo = db.Class('Todo');
