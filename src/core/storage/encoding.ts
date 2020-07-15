import { LCObject, GeoPoint, User } from './Object';
import {
  IObject,
  IDate,
  IACLPrivilege,
  IObjectDataRaw,
  IObjectData,
} from '../types';
import { isDate, assert } from '../utils';
import { ACL } from './ACL';

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
        const date = value as Date;
        if (key === 'createdAt' || key == 'updatedAt') {
          encoded[key] = date.toISOString();
        } else {
          const d: IDate = { __type: 'Date', iso: date.toISOString() };
          encoded[key] = d;
        }
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

  static encode(obj: IObject): Record<string, unknown> {
    const encoded: Record<string, unknown> = {};
    if (obj.data) {
      Object.assign(encoded, ObjectEncoder.encodeData(obj.data));
    }
    if (obj.className) {
      encoded.className = obj.className;
    }
    if (obj.objectId) {
      encoded.objectId = obj.objectId;
    }
    return encoded;
  }
}

export class ObjectDecoder {
  static decodeData(data: unknown): unknown {
    const { constructor } = Object.getPrototypeOf(data);
    const decoded = new constructor();

    Object.entries(data).forEach(([key, value]) => {
      if (!value) return;

      switch (value.__type) {
        case 'Date':
          decoded[key] = new Date(value.iso);
          return;

        case 'Pointer':
          decoded[key] = ObjectDecoder.decode(value);
          return;

        case 'GeoPoint':
          decoded[key] = new GeoPoint(value.latitude, value.longitude);
          return;
      }

      if (typeof value === 'object') {
        decoded[key] = ObjectDecoder.decodeData(value);
      } else {
        decoded[key] = value;
      }
    });

    return decoded;
  }

  static decode(data: IObjectDataRaw, className?: string): LCObject {
    assert(data.objectId, 'The objectId must be provided');
    if (!className) {
      assert(
        data.className,
        'The data must contain className when className parameter is undefined'
      );
      className = data.className;
    }

    let obj: LCObject;
    switch (className) {
      case '_User':
        obj = new User(data.objectId);
        break;

      default:
        obj = new LCObject(className, data.objectId);
    }

    const _data = { ...data };
    ['__type', 'className', 'createdAt', 'updatedAt', 'ACL'].forEach(
      (key) => delete _data[key]
    );
    obj.data = ObjectDecoder.decodeData(_data) as IObjectData;

    if (data.createdAt) {
      obj.data.createdAt = new Date(data.createdAt);
    }
    if (data.updatedAt) {
      obj.data.updatedAt = new Date(data.updatedAt);
    }
    if (data.ACL) {
      obj.data.ACL = ACL.from(data.ACL as Record<string, IACLPrivilege>);
    }

    return obj;
  }
}
