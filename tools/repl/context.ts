import * as env from '../../env';
import * as AV from '../../src/core';
import { node } from '../../src/Node';

export { env, AV };

export const app = new AV.App({
  appId: env.appId,
  appKey: env.appKey,
  serverURL: env.serverURL,
  platform: node,
});

export const db = app.storage();

export const Test = db.Class('Test');
export const Todo = db.Class('Todo');
export { QiniuFileProvider } from '../../src/core/storage/FileProvider/FileProvider';
export { File } from '../../src/core/storage/ObjectReference';
