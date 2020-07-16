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
} from '../types';
import { ObjectEncoder, ObjectDecoder } from './ObjectEncoding';
import { ACL } from './ACL';
import { IHTTPResponse } from '../../adapters';
import { APIPath } from './APIPath';

export class ObjectGetTask {
  request: HTTPRequest;
  responseBody: unknown;

  constructor(public obj: LCObject) {}

  make(option?: IObjectGetOption): this {
    const { className, objectId } = this.obj;
    this.request = new HTTPRequest({
      path: APIPath.get(className, objectId),
    });
    if (option?.include) {
      this.request.query.include = option.include.join(',');
    }
    return this;
  }

  async send(option?: IAuthOption): Promise<this> {
    const res = await this.obj.app._uluru(this.request, option);
    this.responseBody = res.body;
    return this;
  }

  parse(): IObject {
    if (!this.responseBody) {
      throw new Error('The responseBody is undefined');
    }
    if (Object.keys(this.responseBody).length === 0) {
      throw new Error('objectId not exists');
    }
    const { app, className } = this.obj;
    return ObjectDecoder.decode(this.responseBody, className).setApp(app);
  }

  async do(option?: IObjectGetOption): Promise<IObject> {
    if (!this.request) {
      this.make(option);
    }
    if (!this.responseBody) {
      await this.send(option);
    }
    return this.parse();
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
    function extractData(obj: LCObject): unknown {
      const items: unknown[] = obj.data ? [obj.data] : [];
      while (items.length > 0) {
        const item = items.shift();
        Object.entries(item).forEach(([key, value]) => {
          if (!value) return;
          if (value instanceof LCObject) {
            item[key] = extractData(value);
          } else if (typeof value === 'object') {
            items.push(value);
          }
        });
      }
      return obj.data;
    }
    return extractData(this);
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

  sendUpdateRequest(
    data: IObjectData,
    option?: IObjectUpdateOption
  ): Promise<IHTTPResponse> {
    removeReservedKeys(data);
    const req = new HTTPRequest({
      method: 'PUT',
      path: this._path,
      body: ObjectEncoder.encodeData(data),
    });
    if (option?.include) {
      req.query.include = option.include.join(',');
    }
    if (option?.fetch) {
      req.query.fetchWhenSave = 'true';
    }
    return this.app._uluru(req);
  }

  get(option?: IObjectGetOption): Promise<IObject> {
    return new ObjectGetTask(this).do(option);
  }

  async update(
    data: IObjectData,
    option?: IObjectUpdateOption
  ): Promise<IObject> {
    const res = await this.sendUpdateRequest(data, option);
    const obj = new LCObject(this.className, this.objectId, this.app);
    obj.data = ObjectDecoder.decodeData(res.body);
    return obj;
  }

  async delete(option?: IAuthOption): Promise<void> {
    const req = new HTTPRequest({ method: 'DELETE', path: this._path });
    await this.app._uluru(req, option);
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
