import { v4 as uuid } from 'uuid';
import { App } from '../app';
import { HTTPRequest } from '../http';
import { Pointer } from './Storage';

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

export class ObjectReference {
  constructor(
    public app: App,
    public className: string,
    public objectId?: string
  ) {}

  // TODO: this implementation is bad
  static encodeAdvancedType(obj: Record<string, unknown>): void {
    const items: unknown[] = [obj];
    while (items.length > 0) {
      const first = items.shift();
      Object.entries(first).forEach(([key, value]) => {
        if (value && value.constructor.name === 'Date') {
          first[key] = { __type: 'Date', iso: value.toISOString() };
          return;
        }

        if (
          Array.isArray(value) ||
          (typeof value === 'object' && value !== null)
        ) {
          items.push(value);
        }
      });
    }
  }

  static decodeAdvancedType(data: ObjectAttributes): void {
    data.createdAt = new Date(data.createdAt);
    data.updatedAt = new Date(data.updatedAt);

    const items: unknown[] = [data];
    while (items.length > 0) {
      const item = items.shift();
      Object.entries(item).forEach(([key, value]) => {
        if (!value) return;
        switch (value.__type) {
          case 'Date': {
            item[key] = new Date(value.iso);
            return;
          }
        }
        if (Array.isArray(value) || typeof value === 'object') {
          items.push(value);
        }
      });
    }
  }

  get classPath(): string {
    if (this.className === '_User') {
      return '/1.1/users';
    }
    return `/1.1/classes/${this.className}`;
  }
  get objectPath(): string {
    if (this.objectId) {
      return this.classPath + '/' + this.objectId;
    }
    return this.classPath;
  }

  toJSON(): Pointer {
    return new Pointer(this.className, this.objectId);
  }

  async set(data: ObjectAttributes): Promise<void> {
    removeReservedKeys(data);
    ObjectReference.encodeAdvancedType(data);
    const req = new HTTPRequest({
      method: this.objectId ? 'PUT' : 'POST',
      path: this.objectPath,
      body: data,
    });
    const res: ObjectAttributes = await this.app._doRequest(req);
    this.objectId = res.objectId;
  }

  async delete(): Promise<void> {
    if (this.objectId === undefined) {
      throw new Error('Cannot delete an object without objectId');
    }
    const req = new HTTPRequest({
      method: 'DELETE',
      path: this.objectPath,
    });
    await this.app._doRequest(req);
  }

  async get(): Promise<ObjectAttributes> {
    if (!this.objectId) {
      throw new Error('Cannot get an object without objectId');
    }
    const req = new HTTPRequest({
      method: 'GET',
      path: this.objectPath,
    });
    const res = await this.app._doRequest(req);
    ObjectReference.decodeAdvancedType(res);
    return res;
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
