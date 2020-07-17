import { v4 as uuid } from 'uuid';
import { decode } from 'base64-arraybuffer';
import { App } from '../App';
import { removeReservedKeys, HTTPRequest } from '../utils';
import {
  IObject,
  IPointer,
  IObjectGetOption,
  IObjectUpdateOption,
  IAuthOption,
  IFile,
  IObjectData,
  IObjectOperateTask,
  IObjectAddOption,
} from '../types';
import { ObjectEncoder, ObjectDecoder } from './ObjectEncoding';
import { ACL } from './ACL';
import { APIPath } from './APIPath';

export class ObjectCreateTask implements IObjectOperateTask {
  request: HTTPRequest;
  responseBody: unknown;

  constructor(
    public app: App,
    public className: string,
    public data: IObjectData,
    public option?: IObjectAddOption
  ) {}

  makeRequest(): HTTPRequest {
    removeReservedKeys(this.data);
    const req = new HTTPRequest({
      method: 'POST',
      path: APIPath.get(this.className),
      body: ObjectEncoder.encodeData(this.data),
    });
    if (this.option?.fetch) {
      req.query.fetchWhenSave = 'true';
    }
    this.request = req;
    return req;
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
  request: HTTPRequest;
  responseBody: unknown;

  constructor(public obj: LCObject, public option?: IObjectGetOption) {}

  makeRequest(): HTTPRequest {
    const { className, objectId } = this.obj;
    const req = new HTTPRequest({
      path: APIPath.get(className, objectId),
    });
    if (this.option?.include) {
      req.query.include = this.option.include.join(',');
    }
    this.request = req;
    return req;
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

  makeRequest(): HTTPRequest {
    removeReservedKeys(this.data);
    const { className, objectId } = this.obj;
    const req = new HTTPRequest({
      method: 'PUT',
      path: APIPath.get(className, objectId),
      body: ObjectEncoder.encodeData(this.data),
    });
    if (this.option?.include) {
      req.query.include = this.option.include.join(',');
    }
    if (this.option?.fetch) {
      req.query.fetchWhenSave = 'true';
    }
    this.request = req;
    return req;
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

  makeRequest(): HTTPRequest {
    const { className, objectId } = this.obj;
    const req = new HTTPRequest({
      method: 'DELETE',
      path: APIPath.get(className, objectId),
    });
    this.request = req;
    return req;
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

  protected get _path(): string {
    return `/1.1/classes/${this.className}/${this.objectId}`;
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
        if (typeof value === 'object') {
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

export class File implements IFile {
  __type: 'File' = 'File';
  key: string;
  name: string;
  data: ArrayBuffer;
  mime: string;
  objectId: string;
  ACL?: ACL;

  constructor(name: string, data?: unknown) {
    this.key = uuid();
    if (name.includes('.')) {
      const ext = name.split('.').pop();
      this.key += '.' + ext;
    }
    this.name = name;

    if (data instanceof ArrayBuffer) {
      this.data = data;
    }
    if (typeof data === 'string') {
      this.data = decode(data);
    }
  }

  static fromRawString(name: string, data: string): File {
    const file = new File(name);
    const encoder = new TextEncoder();
    file.data = encoder.encode(data).buffer;
    return file;
  }
}
