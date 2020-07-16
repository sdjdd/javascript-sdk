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

  async update(
    data: IObjectData,
    option?: IObjectUpdateOption
  ): Promise<IObject> {
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
    const res = await this.app._uluru(req);

    const obj = new LCObject(this.className, this.objectId, this.app);
    obj.data = ObjectDecoder.decodeData(res.body);
    return obj;
  }

  async delete(option?: IAuthOption): Promise<void> {
    const req = new HTTPRequest({ method: 'DELETE', path: this._path });
    await this.app._uluru(req, option);
  }

  async get(option?: IObjectGetOption): Promise<IObject> {
    const req = new HTTPRequest({ path: this._path });
    if (option?.include) {
      req.query.include = option.include.join(',');
    }
    const res = await this.app._uluru(req);

    if (Object.keys(res.body).length === 0) {
      throw new Error('objectId not exists');
    }
    return ObjectDecoder.decode(res.body, this.className).setApp(this.app);
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
