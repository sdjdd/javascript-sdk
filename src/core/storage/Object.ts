import { v4 as uuid } from 'uuid';
import { decode } from 'base64-arraybuffer';
import { App, KEY_CURRENT_USER } from '../App';
import { removeReservedKeys, HTTPRequest, fail, deleteKey } from '../utils';
import {
  IObject,
  IGeoPoint,
  IPointer,
  IObjectGetOption,
  IObjectUpdateOption,
  IUser,
  IAuthOption,
  IUserData,
  IOperation,
  IFile,
  IObjectData,
  IObjectDataRaw,
} from '../types';
import { ObjectEncoder, ObjectDecoder } from './encoding';
import { UserClass } from './Class';
import { UluruError } from '../errors';
import { ACL } from './ACL';

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

  toJSON(): unknown {
    function extractData(obj: LCObject): unknown {
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
  ): Promise<LCObject> {
    removeReservedKeys(data);

    const req = new HTTPRequest({
      method: 'PUT',
      path: this._path,
      body: ObjectEncoder.encodeData(data),
    });
    if (option?.include) {
      req.query.include = option.include.join(',');
    }
    if (option?.fetch) {
      req.query.fetchWhenSave = 'true';
    }
    const res = await this.app._uluru(req);

    const obj = new LCObject(this.className, this.objectId, this.app);
    obj.data = ObjectDecoder.decodeData(res.body) as IObjectData;
    return obj;
  }

  async delete(option?: IAuthOption): Promise<void> {
    const req = new HTTPRequest({ method: 'DELETE', path: this._path });
    await this.app._uluru(req, option);
  }

  async get(option?: IObjectGetOption): Promise<LCObject> {
    const req = new HTTPRequest({ path: this._path });
    if (option?.include) {
      req.query.include = option.include.join(',');
    }
    const res = await this.app._uluru(req);

    const attr = res.body as IObjectDataRaw;
    if (Object.keys(attr).length === 0) {
      throw new Error('objectId not exists');
    }

    return ObjectDecoder.decode(attr, this.className).setApp(this.app);
  }
}

export class File implements IFile {
  __type: 'File' = 'File';
  key: string;
  name: string;
  data: ArrayBuffer;
  mime: string;
  objectId: string;
  ACL?: ACL;

  constructor(name: string, data?: unknown) {
    this.key = uuid();
    if (name.includes('.')) {
      const ext = name.split('.').pop();
      this.key += '.' + ext;
    }
    this.name = name;

    if (data instanceof ArrayBuffer) {
      this.data = data;
    }
    if (typeof data === 'string') {
      this.data = decode(data);
    }
  }

  static fromRawString(name: string, data: string): File {
    const file = new File(name);
    const encoder = new TextEncoder();
    file.data = encoder.encode(data).buffer;
    return file;
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
    return this.data?.sessionToken as string;
  }

  protected get _path(): string {
    return '/1.1/users/' + this.objectId;
  }

  isCurrentUser(): boolean {
    const currentUser = UserClass._getCurrentUser(this.app);
    return this.objectId === currentUser?.objectId;
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
    if (!this.sessionToken) {
      fail('The user is not logged in');
    }

    const req = new HTTPRequest({
      method: 'PUT',
      path: `/1.1/users/${this.objectId}/updatePassword`,
      body: { old_password: oldPassword, new_password: newPassword },
    });
    const res = await this.app._uluru(req, {
      sessionToken: this.sessionToken,
      ...option,
    });

    const data = res.body as IUserData;
    this.data.sessionToken = data.sessionToken;

    if (this.isCurrentUser()) {
      this.app.setSessionToken(null);
      this.app._cacheRemove(KEY_CURRENT_USER);

      const userKV = JSON.parse(this.app._kvGet(KEY_CURRENT_USER));
      userKV.sessionToken = this.sessionToken;
      this.app._kvSet(KEY_CURRENT_USER, JSON.stringify(userKV));
    }
  }

  async get(option?: IObjectGetOption): Promise<User> {
    const req = new HTTPRequest({ path: this._path });
    if (option?.include) {
      req.query.include = option.include.join(',');
    }
    const res = await this.app._uluru(req);

    const data = res.body as IObjectDataRaw;
    if (Object.keys(data).length === 0) {
      fail(`User with objectId(${this.objectId}) is not exists`);
    }

    const user = ObjectDecoder.decode(data, this.className) as User;
    user.setApp(this.app);

    if (user.isCurrentUser()) {
      this.app._cacheRemove(KEY_CURRENT_USER);

      const userKV = JSON.parse(this.app._kvGet(KEY_CURRENT_USER));
      Object.assign(userKV, data);
      this.app._kvSet(KEY_CURRENT_USER, JSON.stringify(userKV));
    }
    return user;
  }

  async update(data: IUserData, option?: IObjectUpdateOption): Promise<User> {
    removeReservedKeys(data);

    const req = new HTTPRequest({
      method: 'PUT',
      path: this._path,
      body: ObjectEncoder.encodeData(data),
    });
    if (option?.include) {
      req.query.include = option.include.join(',');
    }
    if (option?.fetch) {
      req.query.fetchWhenSave = 'true';
    }
    const res = await this.app._uluru(req);

    const _data = res.body as IObjectDataRaw;
    const user = ObjectDecoder.decode(_data, this.className) as User;

    if (this.isCurrentUser()) {
      this.app._cacheRemove(KEY_CURRENT_USER);

      const userKV = JSON.parse(this.app._kvGet(KEY_CURRENT_USER));
      Object.entries(data).forEach(([key, value]) => {
        const op = value as IOperation;
        if (op?.__op === 'Delete') {
          deleteKey(userKV, key);
        }
      });
      Object.assign(userKV, _data);
      this.app._kvSet(KEY_CURRENT_USER, JSON.stringify(userKV));
    }
    return user;
  }

  async delete(option?: IAuthOption): Promise<void> {
    await super.delete(option);
    if (this.isCurrentUser()) {
      UserClass.logOut(this.app);
    }
  }
}
