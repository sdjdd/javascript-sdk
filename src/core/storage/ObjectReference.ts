import { AdvancedType, isAdvancedType } from './AdvancedType';
import { v4 as uuid } from 'uuid';
import { API } from '../app/API';

const RESERVED_KEYS = new Set(['objectId', 'createdAt', 'updatedAt']);
function removeReservedKeys(obj: Record<string, unknown>) {
  Object.keys(obj).forEach((key) => {
    if (RESERVED_KEYS.has(key)) {
      delete obj[key];
    }
  });
}

export interface LCObject {
  objectId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export class ObjectReference {
  constructor(
    public api: API,
    public className: string,
    public objectId?: string
  ) {}

  toJSON(): Pointer {
    return new Pointer(this.className, this.objectId);
  }

  async set(obj: Record<string, unknown>): Promise<void> {
    removeReservedKeys(obj);
    if (this.objectId === undefined) {
      this.objectId = await this.api.createObject(this.className, obj);
    } else {
      await this.api.updateObject(this.className, this.objectId, obj);
    }
  }

  async delete(): Promise<void> {
    if (this.objectId === undefined) {
      return;
    }
    await this.api.deleteObject(this.className, this.objectId);
  }

  async get(): Promise<unknown> {
    const data = await this.api.getObject(this.className, this.objectId);
    this._parseAdvancedType(data);
    return data;
  }

  private _parseAdvancedType(data: Record<string, unknown>) {
    Object.entries(data).forEach(([key, value]) => {
      if (isAdvancedType(value)) {
        const adv = value as AdvancedType;
        switch (adv.__type) {
          case 'Pointer':
            break;
          case 'GeoPoint':
        }
      }
    });
  }
}

export class GeoPoint implements AdvancedType {
  __type = 'GeoPoint';
  constructor(public latitude: number, public longitude: number) {}
}

export class Pointer implements AdvancedType {
  __type = 'Pointer';
  constructor(public className: string, public objectId: string) {}
}

export class File implements AdvancedType {
  __type = 'File';
  key: string;
  name: string;
  data: string;
  mime: string;

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

interface FileProvider {
  name: string;
  upload(file: File, token: string);
}

// export class FileProviderQiniu implements FileProvider {
//   name = 'qiniu';
//   constructor(private _client: HTTPClient) {}
//   upload(file: File, url: string, token: string) {
//     this._client.post(url, );
//   }
// }
