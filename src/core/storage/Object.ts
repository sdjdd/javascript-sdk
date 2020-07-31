import { App } from '../App';
import { removeReservedKeys, checkObjectTag } from '../utils';
import {
  IObject,
  IPointer,
  IObjectGetOption,
  IObjectUpdateOption,
  IAuthOption,
  IObjectData,
  IObjectOperateTask,
  IObjectAddOption,
} from '../types';
import { ObjectEncoder, ObjectDecoder } from './ObjectEncoding';
import { APIPath } from '../APIPath';
import { IHTTPRequest } from '../Adapters';

export class ObjectCreateTask implements IObjectOperateTask {
  request: IHTTPRequest;
  responseBody: unknown;

  constructor(
    public app: App,
    public className: string,
    public data: IObjectData,
    public option?: IObjectAddOption
  ) {}

  makeRequest(): IHTTPRequest {
    removeReservedKeys(this.data);
    this.request = {
      method: 'POST',
      path: APIPath.class(this.className),
      body: ObjectEncoder.encodeData(this.data),
      query: {
        fetchWhenSave: this.option?.fetch ? 'true' : null,
      },
    };
    return this.request;
  }

  async sendRequest(): Promise<unknown> {
    const res = await this.app._uluru(this.request, this.option);
    this.responseBody = res.body;
    return this.responseBody;
  }

  encodeResponse(): IObject {
    if (!this.responseBody) {
      throw new Error('The responseBody is undefined');
    }
    const obj = ObjectDecoder.decode(this.responseBody, this.className);
    return obj.setApp(this.app);
  }

  async do(): Promise<IObject> {
    if (!this.request) {
      this.makeRequest();
    }
    if (!this.responseBody) {
      await this.sendRequest();
    }
    return this.encodeResponse();
  }
}

export class ObjectGetTask implements IObjectOperateTask {
  request: IHTTPRequest;
  responseBody: unknown;

  constructor(public obj: LCObject, public option?: IObjectGetOption) {}

  makeRequest(): IHTTPRequest {
    const { className, objectId } = this.obj;
    this.request = {
      path: APIPath.object(className, objectId),
      query: {
        include: this.option?.include?.join(','),
      },
    };
    return this.request;
  }

  async sendRequest(): Promise<unknown> {
    const res = await this.obj.app._uluru(this.request, this.option);
    this.responseBody = res.body;
    return this.responseBody;
  }

  encodeResponse(): IObject {
    if (!this.responseBody) {
      throw new Error('The responseBody is undefined');
    }
    if (!this.responseBody || Object.keys(this.responseBody).length === 0) {
      throw new Error('objectId not exists');
    }
    const { app, className } = this.obj;
    return ObjectDecoder.decode(this.responseBody, className).setApp(app);
  }

  async do(): Promise<IObject> {
    if (!this.request) {
      this.makeRequest();
    }
    if (!this.responseBody) {
      await this.sendRequest();
    }
    return this.encodeResponse();
  }
}

export class ObjectUpdateTask extends ObjectGetTask
  implements IObjectOperateTask {
  constructor(
    public obj: LCObject,
    public data: IObjectData,
    public option?: IObjectUpdateOption
  ) {
    super(obj);
  }

  makeRequest(): IHTTPRequest {
    removeReservedKeys(this.data);
    const { className, objectId } = this.obj;
    this.request = {
      method: 'PUT',
      path: APIPath.object(className, objectId),
      body: ObjectEncoder.encodeData(this.data),
      query: {
        include: this.option?.include?.join(','),
        fetchWhenSave: this.option?.fetch ? 'true' : null,
      },
    };
    return this.request;
  }

  encodeResponse(): IObject {
    if (!this.responseBody) {
      throw new Error('The responseBody is undefined');
    }
    const { app, className, objectId } = this.obj;
    const obj = new LCObject(className, objectId, app);
    obj.data = ObjectDecoder.decodeData(this.responseBody);
    return obj;
  }
}

export class ObjectDeleteTask extends ObjectGetTask
  implements IObjectOperateTask {
  constructor(public obj: LCObject, public option?: IAuthOption) {
    super(obj);
  }

  makeRequest(): IHTTPRequest {
    const { className, objectId } = this.obj;
    this.request = {
      method: 'DELETE',
      path: APIPath.object(className, objectId),
    };
    return this.request;
  }

  encodeResponse(): IObject {
    return void 0;
  }
}

export class LCObject implements IObject {
  app: App;
  className: string;
  objectId: string;
  data?: IObjectData;

  constructor(className: string, objectId: string, app?: App) {
    this.app = app;
    this.className = className;
    this.objectId = objectId;
  }

  toJSON(): unknown {
    function extractData(data: unknown): unknown {
      const { constructor } = Object.getPrototypeOf(data);
      const extracted = new constructor();
      Object.entries(data).forEach(([key, value]) => {
        if (!value) return;
        if (value instanceof LCObject) {
          extracted[key] = extractData(value.data);
          return;
        }
        if (Array.isArray(value) || checkObjectTag(value, 'Object')) {
          extracted[key] = extractData(value);
        } else {
          extracted[key] = value;
        }
      });
      return extracted;
    }
    return extractData(this.data);
  }

  toPointer(): IPointer {
    return {
      __type: 'Pointer',
      className: this.className,
      objectId: this.objectId,
    };
  }

  setApp(app: App): this {
    this.app = app;
    if (this.data) {
      const datas: unknown[] = [this.data];
      while (datas.length > 0) {
        const data = datas.shift();
        Object.values(data).forEach((value) => {
          if (value instanceof LCObject) {
            value.app = app;
            if (value.data) {
              datas.push(value.data);
            }
          }
        });
      }
    }
    return this;
  }

  get(option?: IObjectGetOption): Promise<IObject> {
    return new ObjectGetTask(this, option).do();
  }

  update(data: IObjectData, option?: IObjectUpdateOption): Promise<IObject> {
    return new ObjectUpdateTask(this, data, option).do();
  }

  delete(option?: IAuthOption): Promise<void> {
    return new ObjectDeleteTask(this, option).do() as Promise<undefined>;
  }
}
