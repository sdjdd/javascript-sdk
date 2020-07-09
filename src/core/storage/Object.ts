import { v4 as uuid } from 'uuid';
import { App } from '../App';
import { removeReservedKeys } from '../utils';
import {
  IObject,
  IGeoPoint,
  IPointer,
  IObjectData,
  IObjectGetOption,
  IObjectUpdateOption,
  IUser,
  IAuthOption,
} from '../types';
import { ObjectEncoder, ObjectDecoder } from './encoding';
import { HTTPRequest } from '../http';

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

    const query: HTTPRequest['query'] = {};
    if (option?.include) {
      query.include = option.include.join(',');
    }

    const res = await this.app._requestToUluru({
      method: 'PUT',
      path: this._path,
      body: ObjectEncoder.encodeData(data),
      query,
    });

    const obj = new LCObject(this.className, this.objectId, this.app);
    obj.data = res.body as IObjectData;
    return obj;
  }

  async delete(option?: IAuthOption): Promise<void> {
    await this.app._requestToUluru(
      { method: 'DELETE', path: this._path },
      option
    );
  }

  async get(option?: IObjectGetOption): Promise<IObject> {
    const query: HTTPRequest['query'] = {};
    if (option?.include) {
      query.include = option.include.join(',');
    }

    const res = await this.app._requestToUluru({
      method: 'GET',
      path: this._path,
      query,
    });

    const attr = res.body as IObjectData;
    if (Object.keys(attr).length === 0) {
      throw new Error('objectId not exists');
    }

    return ObjectDecoder.decode(attr, this.className).setApp(this.app);
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
  constructor(objectId: string, app?: App) {
    super('_User', objectId, app);
  }

  get sessionToken(): string {
    return this.data.sessionToken as string;
  }

  isAnonymous(): boolean {
    if (!this.data) {
      return false;
    }
    if (!this.data.authData) {
      return false;
    }
    const authData = this.data.authData as { anonymous: string };
    return authData.anonymous !== undefined;
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      await this.app._requestToUluru({
        method: 'GET',
        path: this._path + '/me',
        header: { 'X-LC-Session': this.sessionToken },
      });
      return true;
    } catch (err) {
      return false; // TODO: check error code
    }
  }

  async updatePassword(
    oldPassword: string,
    newPassword: string,
    option?: IAuthOption
  ): Promise<void> {
    await this.app._requestToUluru(
      {
        method: 'PUT',
        path: this._path + '/' + this.objectId + '/updatePassword',
        header: { 'X-LC-Session': this.sessionToken },
        body: {
          old_password: oldPassword,
          new_password: newPassword,
        },
      },
      option
    );
  }
}
