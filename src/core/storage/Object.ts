import { v4 as uuid } from 'uuid';
import { App } from '../App';
import { isDate, checkUluruResponse } from '../utils';
import { ACL, ACLPrivilege } from './ACL';
import { PlatformSupport } from '../Platform';
import {
  IObject,
  IGeoPoint,
  IPointer,
  IObjectData,
  IObjectGetOption,
  IObjectUpdateOption,
} from '../types';

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

  static encodeAdvancedType(data: IObjectData): void {
    Object.entries(data as unknown).forEach(([key, value]) => {
      if (!value) return;

      if (value instanceof LCObject) {
        data[key] = value.toPointer();
        return;
      }

      if (isDate(value)) {
        data[key] = { __type: 'Date', iso: value.toISOString() };
        return;
      }

      if (typeof value === 'object') {
        LCObject.encodeAdvancedType(value);
      }
    });
  }

  static decodeData<T>(before: T, app: App): T {
    const after = (Array.isArray(before) ? [] : {}) as T;
    Object.entries(before as unknown).forEach(([key, value]) => {
      if (!value) return;

      switch (value.__type) {
        case 'Date':
          after[key] = new Date(value.iso);
          return;

        case 'Pointer': {
          after[key] = LCObject.decode(value, app);
          return;
        }

        case 'GeoPoint':
          after[key] = new GeoPoint(value.latitude, value.longitude);
          return;
      }

      if (typeof value === 'object') {
        after[key] = LCObject.decodeData(value, app);
      } else {
        after[key] = value;
      }
    });
    return after;
  }

  static decode(data: IObjectData, app: App, className?: string): LCObject {
    const obj = new LCObject(app, className ?? data.className, data.objectId);

    const _data = { ...data };
    ['__type', 'className', 'createdAt', 'updatedAt', 'ACL'].forEach(
      (key) => delete _data[key]
    );
    obj.data = LCObject.decodeData(_data, app);

    if (data.createdAt) {
      obj.data.createdAt = new Date(data.createdAt);
    }
    if (data.updatedAt) {
      obj.data.updatedAt = new Date(data.updatedAt);
    }
    if (data.ACL) {
      obj.data.ACL = ACL.from(data.ACL as Record<string, ACLPrivilege>);
    }
    return obj;
  }

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
  ): Promise<LCObject> {
    removeReservedKeys(data);
    LCObject.encodeAdvancedType(data);
    const req = this.app._makeBaseRequest('PUT', this.path);
    req.body = data;
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

  async get(option?: IObjectGetOption): Promise<LCObject> {
    const req = this.app._makeBaseRequest('GET', this.path);
    if (option?.include) {
      req.query.include = option.include.join(',');
    }

    const platform = PlatformSupport.getPlatform();
    const res = await platform.network.request(req);
    checkUluruResponse(res);

    const attr = res.body as IObjectData;
    return LCObject.decode(attr, this.app);
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
