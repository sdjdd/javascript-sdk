import { v4 as uuid } from 'uuid';
import { App } from '../app';
import { Pointer } from './Storage';
import { isDate, checkUluruResponse } from '../utils';
import { ACL } from './ACL';
import { PlatformSupport } from '../Platform';

const RESERVED_KEYS = new Set(['objectId', 'createdAt', 'updatedAt']);
function removeReservedKeys(obj: Record<string, unknown>) {
  Object.keys(obj).forEach((key) => {
    if (RESERVED_KEYS.has(key)) {
      delete obj[key];
    }
  });
}

export interface ObjectAttributes {
  objectId?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  [key: string]: unknown;
}

export interface ObjectGetOption {
  include?: string[];
}

export class ObjectReference {
  data?: ObjectAttributes;

  constructor(
    public app: App,
    public className: string,
    public objectId: string
  ) {}

  // TODO: rafactor
  static encodeAdvancedType(obj: Record<string, unknown>): void {
    const items: unknown[] = [obj];
    while (items.length > 0) {
      const item = items.shift();
      Object.entries(item).forEach(([key, value]) => {
        if (!value) return;

        if (isDate(value)) {
          item[key] = { __type: 'Date', iso: value.toISOString() };
          return;
        }

        if (typeof value === 'object') {
          items.push(value);
        }
      });
    }
  }

  // TODO: rafactor
  static decodeAdvancedType(app: App, data: ObjectAttributes): void {
    if (data.createdAt) {
      data.createdAt = new Date(data.createdAt);
    }
    if (data.updatedAt) {
      data.updatedAt = new Date(data.updatedAt);
    }

    const items: unknown[] = [data];
    while (items.length > 0) {
      const item = items.shift();
      Object.entries(item).forEach(([key, value]) => {
        if (!value) return;
        switch (key) {
          case 'ACL':
            item[key] = ACL.from(value);
            return;
        }
        switch (value.__type) {
          case 'Date':
            item[key] = new Date(value.iso);
            return;

          case 'Pointer': {
            const obj = new ObjectReference(
              app,
              value.className,
              value.objectId
            );
            delete value.__type;
            delete value.className;
            delete value.objectId;
            if (Object.keys(value).length > 0) {
              obj.data = value;
              items.push(obj.data);
            }
            item[key] = obj;
            return;
          }
        }
        if (typeof value === 'object') {
          items.push(value);
        }
      });
    }
  }

  toJSON(): Pointer {
    return new Pointer(this.className, this.objectId);
  }

  async update(
    data: ObjectAttributes,
    option: ObjectGetOption
  ): Promise<ObjectAttributes> {
    removeReservedKeys(data);
    ObjectReference.encodeAdvancedType(data);
    const req = this.app._makeBaseRequest(
      'PUT',
      `/1.1/classes/${this.className}/${this.objectId}`
    );
    req.body = data;
    if (option?.include) {
      req.query = { include: option.include.join(',') };
    }

    const platform = PlatformSupport.getPlatform();
    const res = await platform.network.request(req);
    checkUluruResponse(res);

    return res.body as ObjectAttributes;
  }

  async delete(): Promise<void> {
    if (this.objectId === undefined) {
      throw new Error('Cannot delete an object without objectId');
    }
    const req = this.app._makeBaseRequest(
      'DELETE',
      `/1.1/classes/${this.className}/${this.objectId}`
    );
    const platform = PlatformSupport.getPlatform();
    const res = await platform.network.request(req);
    checkUluruResponse(res);
  }

  async get(option?: ObjectGetOption): Promise<ObjectAttributes> {
    if (!this.objectId) {
      throw new Error('Cannot get an object without objectId');
    }
    const req = this.app._makeBaseRequest(
      'GET',
      `/1.1/classes/${this.className}/${this.objectId}`
    );
    if (option?.include) {
      req.query = { include: option.include.join(',') };
    }

    const platform = PlatformSupport.getPlatform();
    const res = await platform.network.request(req);
    checkUluruResponse(res);

    const attr = res.body as ObjectAttributes;
    ObjectReference.decodeAdvancedType(this.app, attr);
    return attr;
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
