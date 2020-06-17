import * as env from '../../env';
import * as AV from '../../src/Node';

export { env, AV };

export const app = new AV.App({
  appId: env.appId,
  appKey: env.appKey,
  serverURL: env.serverURL,
});

export const db = app.storage();

export const Test = db.Class('Test');
export const Todo = db.Class('Todo');
