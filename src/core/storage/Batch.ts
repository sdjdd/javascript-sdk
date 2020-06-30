import { App } from '../app';
import { ObjectReference, ObjectAttributes } from './Object';
import { HTTPRequest } from '../http';

export interface BatchResultSuccess {
  objectId: string;
  updatedAt: string;
}

export interface BatchResultError {
  code: number;
  error: string;
}

export interface BatchResult {
  success?: BatchResultSuccess;
  error?: BatchResultError;
}

export class Batch {
  private _requests: HTTPRequest[] = [];

  constructor(public app: App) {}

  set(obj: ObjectReference, data: ObjectAttributes): this {
    const req = obj._makeSetRequest(data);
    this._requests.push(req);
    return this;
  }

  commit(): Promise<void>[] {
    const requests = this._requests.map((req) => ({
      method: req.method,
      path: req.path,
      body: req.body,
    }));
    this._requests = [];

    const req = new HTTPRequest({
      method: 'POST',
      path: '/1.1/batch',
      body: { requests },
    });

    const ret = new Array<Promise<void>>(requests.length);
    const promiseHandlers = new Array<{
      resolve: (value?: void | PromiseLike<void>) => void;
      reject: (reason?: unknown) => void;
    }>(requests.length);
    for (let i = 0; i < ret.length; i++) {
      ret[i] = new Promise(
        (resolve, reject) => (promiseHandlers[i] = { resolve, reject })
      );
    }

    this.app._doRequest(req).then((res) => {
      const results = res as BatchResult[];
      results.forEach((result, index) => {
        if (result.success) {
          promiseHandlers[index].resolve();
        } else {
          promiseHandlers[index].reject(
            new Error(
              `code: ${result.error.code}, error: ${result.error.error}`
            )
          );
        }
      });
    });

    return ret;
  }
}
