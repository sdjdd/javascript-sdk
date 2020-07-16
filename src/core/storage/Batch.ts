import { App } from '../App';
import { LCObject, ObjectGetTask } from './Object';
import { IObjectData, IObject } from '../types';
import { HTTPRequest } from '../utils';
import { Class } from './Class';
import { UluruError } from '../errors';

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

interface IPromiseHandler {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}

export class Batch {
  private promises: Promise<unknown>[] = [];
  private promiseHandlers: IPromiseHandler[] = [];
  private tasks: Array<ObjectGetTask> = [];

  constructor(public app: App) {}

  add(clazz: Class, data: IObjectData): Promise<LCObject> {
    return null;
  }

  get(obj: LCObject): Promise<IObject> {
    const promise = new Promise((resolve, reject) => {
      this.promiseHandlers.push({ resolve, reject });
      this.tasks.push(new ObjectGetTask(obj));
    });
    this.promises.push(promise);
    return promise as Promise<IObject>;
  }

  async commit(): Promise<void> {
    const requests: unknown[] = [];
    this.tasks.forEach((task) => {
      task.make();
      requests.push({
        method: task.request.method,
        path: task.request.path,
      });
    });
    const res = await this.app._uluru(
      new HTTPRequest({
        method: 'POST',
        path: '/1.1/batch',
        body: { requests },
      })
    );

    const results = res.body as {
      error?: { code: number; error: string };
      success?: Record<string, unknown>;
    }[];

    results.forEach((result, i) => {
      if (result.error) {
        const { code, error } = result.error;
        this.promiseHandlers[i].reject(new UluruError(code, error));
        return;
      }
      this.tasks[i].responseBody = result.success ?? {};
      const obj = this.tasks[i].parse();
      this.promiseHandlers[i].resolve(obj);
    });
  }
}
