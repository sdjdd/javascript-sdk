import { v4 as uuid } from 'uuid';
import { App } from '../App';
import { checkUluruResponse, requestToUluru } from '../utils';
import { PlatformSupport } from '../Platform';
import {
  IObject,
  IGeoPoint,
  IPointer,
  IObjectData,
  IObjectGetOption,
  IObjectUpdateOption,
  IUser,
} from '../types';
import { ObjectEncoder, ObjectDecoder } from './encoding';

const RESERVED_KEYS = new Set(['objectId', 'createdAt', 'updatedAt']);
function removeReservedKeys(obj: Record<string, unknown>) {
  Object.keys(obj).forEach((key) => {
    if (RESERVED_KEYS.has(key)) {
      delete obj[key];
    }
  });
}

export class LCObject implements IObject {
  app: App;
  className: string;
  objectId: string;
  data?: IObjectData;

  constructor(app: App, className: string, objectId: string) {
    this.app = app;
    this.className = className;
    this.objectId = objectId;
  }

  private get path(): string {
    return `/1.1/classes/${this.className}/${this.objectId}`;
  }

  toJSON(): IObjectData {
    function extractData(obj: LCObject): IObjectData {
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

  async update(
    data: IObjectData,
    option?: IObjectUpdateOption
  ): Promise<IObject> {
    removeReservedKeys(data);
    const req = this.app._makeBaseRequest('PUT', this.path);
    req.body = ObjectEncoder.encodeData(data);
    if (option?.include) {
      req.query.include = option.include.join(',');
    }

    const platform = PlatformSupport.getPlatform();
    const res = await platform.network.request(req);
    checkUluruResponse(res);

    const obj = new LCObject(this.app, this.className, this.objectId);
    obj.data = res.body as IObjectData;
    return obj;
  }

  async delete(): Promise<void> {
    const req = this.app._makeBaseRequest('DELETE', this.path);
    const platform = PlatformSupport.getPlatform();
    const res = await platform.network.request(req);
    checkUluruResponse(res);
  }

  async get(option?: IObjectGetOption): Promise<IObject> {
    const req = this.app._makeBaseRequest('GET', this.path);
    if (option?.include) {
      req.query.include = option.include.join(',');
    }

    const res = await requestToUluru(req);

    const attr = res.body as IObjectData;
    if (Object.keys(attr).length === 0) {
      throw new Error('objectId not exists');
    }
    const decoder = new ObjectDecoder(this.app, this.className);
    return decoder.decode(attr);
  }
}

export class File {
  __type = 'File';
  key: string;
  name: string;
  data: string;
  mime: string;
  objectId: string;

  constructor(name: string, data: string) {
    const ext = name.split('.').pop();
    if (ext.length > 0) {
      this.key = uuid() + '.' + ext;
    } else {
      this.key = uuid();
    }
    this.name = name;
    this.data = data;
  }
}

export class GeoPoint implements IGeoPoint {
  __type: 'GeoPoint' = 'GeoPoint';
  constructor(public latitude: number, public longitude: number) {}
}

export class User extends LCObject implements IUser {
  sessionToken: string;

  constructor(app: App, objectId: string) {
    super(app, '_User', objectId);
  }
}
