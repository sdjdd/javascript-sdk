import { App } from '../App';
import {
  LCObject,
  ObjectGetTask,
  ObjectCreateTask,
  ObjectUpdateTask,
  ObjectDeleteTask,
} from './Object';
import { IObjectData, IObjectOperateTask } from '../types';
import { Class } from './Class';
import { UluruError } from '../errors';
import { APIPath } from '../APIPath';

interface IPromiseHandler {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}

export class Batch {
  private promiseHandlers: IPromiseHandler[] = [];
  private tasks: Array<IObjectOperateTask> = [];

  constructor(public app: App) {}

  add(clazz: Class, data: IObjectData): Promise<LCObject> {
    const promise = new Promise((resolve, reject) =>
      this.promiseHandlers.push({ resolve, reject })
    );
    this.tasks.push(new ObjectCreateTask(this.app, clazz.className, data));
    return promise as Promise<LCObject>;
  }

  get(obj: LCObject): Promise<LCObject> {
    const promise = new Promise((resolve, reject) =>
      this.promiseHandlers.push({ resolve, reject })
    );
    this.tasks.push(new ObjectGetTask(obj));
    return promise as Promise<LCObject>;
  }

  update(obj: LCObject, data: IObjectData): Promise<LCObject> {
    const promise = new Promise((resolve, reject) =>
      this.promiseHandlers.push({ resolve, reject })
    );
    this.tasks.push(new ObjectUpdateTask(obj, data));
    return promise as Promise<LCObject>;
  }

  delete(obj: LCObject): Promise<void> {
    const promise = new Promise((resolve, reject) =>
      this.promiseHandlers.push({ resolve, reject })
    );
    this.tasks.push(new ObjectDeleteTask(obj));
    return promise as Promise<void>;
  }

  async commit(): Promise<unknown[]> {
    const requests: unknown[] = [];
    this.tasks.forEach((task) => {
      task.makeRequest();
      requests.push({
        method: task.request.method,
        path: task.request.path,
        body: task.request.body,
      });
    });
    const res = await this.app._uluru({
      method: 'POST',
      path: APIPath.batch,
      body: { requests },
    });

    const results = res.body as {
      error?: { code: number; error: string };
      success?: Record<string, unknown>;
    }[];

    const ret: unknown[] = [];
    results.forEach((result, i) => {
      if (result.error) {
        const { code, error } = result.error;
        const err = new UluruError(code, error);
        this.promiseHandlers[i].reject(err);
        throw err;
      }
      this.tasks[i].responseBody = result.success;
      const obj = this.tasks[i].encodeResponse();
      this.promiseHandlers[i].resolve(obj);
      ret.push(obj);
    });
    return ret;
  }
}
