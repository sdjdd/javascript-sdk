import { v4 as uuid } from 'uuid';
import { App, KEY_CURRENT_USER } from '../App';
import { removeReservedKeys, UluruError, HTTPRequest } from '../utils';
import {
  IObject,
  IGeoPoint,
  IPointer,
  IObjectData,
  IObjectGetOption,
  IObjectUpdateOption,
  IUser,
  IAuthOption,
  IUserData,
} from '../types';
import { ObjectEncoder, ObjectDecoder } from './encoding';
import { UserClass } from './Class';

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

    const req = new HTTPRequest({
      method: 'PUT',
      path: this._path,
      body: ObjectEncoder.encodeData(data),
    });
    if (option?.include) {
      req.query.include = option.include.join(',');
    }
    const res = await this.app._uluru(req);

    const obj = new LCObject(this.className, this.objectId, this.app);
    obj.data = res.body as IObjectData;
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
  data?: IUserData;

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
      const req = new HTTPRequest({ path: '/1.1/users/me' });
      await this.app._uluru(req, { sessionToken: this.sessionToken });
      return true;
    } catch (err) {
      if ((err as UluruError).code !== 211) {
        throw err;
      }
      return false;
    }
  }

  async updatePassword(
    oldPassword: string,
    newPassword: string,
    option?: IAuthOption
  ): Promise<void> {
    const req = new HTTPRequest({
      method: 'PUT',
      path: `/1.1/users/${this.objectId}/updatePassword`,
      header: { 'X-LC-Session': this.sessionToken },
      body: { old_password: oldPassword, new_password: newPassword },
    });
    const res = await this.app._uluru(req, option);

    const data = res.body as IUserData;
    this.data.sessionToken = data.sessionToken;

    const currentUser = UserClass._getCurrentUser(this.app);
    if (currentUser?.objectId === this.objectId) {
      const userKV = JSON.parse(this.app._kvGet(KEY_CURRENT_USER));
      userKV.sessionToken = this.sessionToken;
      this.app._kvSet(KEY_CURRENT_USER, JSON.stringify(userKV));
      this.app.setSessionToken(this.sessionToken);
    }
  }
}
