import * as env from '../../env';
import { App, Storage, setPlatform } from '../../src/core';
import { node } from '../../src/Node';

export { env };

setPlatform(node);

App.init({
  name: 'REPL APP',
  appId: env.appId,
  appKey: env.appKey,
  serverURL: env.serverURL,
});

export const db = new Storage();

export const Test = db.Class('Test');
export const Todo = db.Class('Todo');
export { HTTPRequest } from '../../src/core/http';
export { ObjectReference } from '../../src/core/ObjectReference';
