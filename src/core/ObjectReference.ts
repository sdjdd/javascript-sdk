import { v4 as uuid } from 'uuid';
import { App } from './app';
import { HTTPRequest } from './http';
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
  readonly objectId?: string;
  readonly createdAt?: string | Date;
  readonly updatedAt?: string | Date;
  [key: string]: unknown;
}

export class ObjectReference {
  constructor(
    public app: App,
    public className: string,
    public objectId?: string
  ) {}

  // TODO: this implementation is bad
  static parseAdvancedType(obj: Record<string, unknown>): void {
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

  toJSON(): Pointer {
    return new Pointer(this.className, this.objectId);
  }

  async set(obj: Record<string, unknown>): Promise<void> {
    removeReservedKeys(obj);
    ObjectReference.parseAdvancedType(obj);
    const req = new HTTPRequest({
      method: 'POST',
      path: `/1.1/classes/${this.className}`,
      body: obj,
    });
    if (this.objectId) {
      req.method = 'PUT';
      req.path += '/' + this.objectId;
    }
    const res = await this.app._doRequest(req);
    this.objectId = res.objectId as string;
  }

  async delete(): Promise<void> {
    if (this.objectId === undefined) {
      return;
    }
    const req = new HTTPRequest({
      method: 'DELETE',
      path: `/1.1/classes/${this.className}/${this.objectId}`,
    });
    await this.app._doRequest(req);
  }

  async get(): Promise<Record<string, unknown>> {
    if (!this.objectId) {
      throw new Error('Cannot get an object without objectId');
    }
    const req = new HTTPRequest({
      method: 'GET',
      path: `/1.1/classes/${this.className}/${this.objectId}`,
    });
    return this.app._doRequest(req);
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
