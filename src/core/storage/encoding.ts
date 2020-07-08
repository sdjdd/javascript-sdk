import { LCObject, GeoPoint } from './Object';
import { IObjectData, IObject, IDate } from '../types';
import { isDate } from '../utils';
import { App } from '../App';
import { ACL, ACLPrivilege } from './ACL';

export class ObjectEncoder {
  static encodeData(data: unknown): unknown {
    const { constructor } = Object.getPrototypeOf(data);
    const encoded = new constructor();

    Object.entries(data).forEach(([key, value]) => {
      if (!value) return;

      if (value instanceof LCObject) {
        encoded[key] = value.toPointer();
        return;
      }

      if (isDate(value)) {
        const date: IDate = {
          __type: 'Date',
          iso: (value as Date).toISOString(),
        };
        encoded[key] = date;
        return;
      }

      if (typeof value === 'object') {
        encoded[key] = ObjectEncoder.encodeData(value);
      } else {
        encoded[key] = value;
      }
    });

    return encoded;
  }

  static encode(obj: IObject): unknown {
    if (obj.data) {
      return ObjectEncoder.encodeData(obj.data);
    }
    return void 0;
  }
}

export class ObjectDecoder {
  constructor(public app: App, public className?: string) {}

  static decodeData(data: unknown, app: App): unknown {
    const { constructor } = Object.getPrototypeOf(data);
    const decoded = new constructor();

    Object.entries(data).forEach(([key, value]) => {
      if (!value) return;

      switch (value.__type) {
        case 'Date':
          decoded[key] = new Date(value.iso);
          return;

        case 'Pointer':
          decoded[key] = ObjectDecoder.decode(value, app);
          return;

        case 'GeoPoint':
          decoded[key] = new GeoPoint(value.latitude, value.longitude);
          return;
      }

      if (typeof value === 'object') {
        decoded[key] = ObjectDecoder.decodeData(value, app);
      } else {
        decoded[key] = value;
      }
    });

    return decoded;
  }

  static decode(data: IObjectData, app: App, className?: string): IObject {
    const obj = new LCObject(app, className ?? data.className, data.objectId);

    const _data = { ...data };
    ['__type', 'className', 'createdAt', 'updatedAt', 'ACL'].forEach(
      (key) => delete _data[key]
    );
    obj.data = ObjectDecoder.decodeData(_data, app) as IObjectData;

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

  decodeData(data: unknown): unknown {
    return ObjectDecoder.decodeData(data, this.app);
  }

  decode(data: IObjectData): IObject {
    return ObjectDecoder.decode(data, this.app, this.className);
  }
}
