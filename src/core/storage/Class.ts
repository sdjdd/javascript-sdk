import { LCObject } from './Object';
import { Query } from './Query';
import { App, KEY_CURRENT_USER } from '../App';
import {
  IObjectData,
  IClass,
  IClassAddOption,
  IObject,
  IUser,
  IUserData,
} from '../types';
import { ObjectDecoder, ObjectEncoder } from './encoding';
import { HTTPRequest } from '../http';

export class Class extends Query implements IClass {
  app: App;

  protected get _path(): string {
    return '/1.1/classes/' + this.className;
  }

  object(id: string): LCObject {
    return new LCObject(this.className, id, this.app);
  }

  async add(data: IObjectData, option?: IClassAddOption): Promise<IObject> {
    const query: HTTPRequest['query'] = {};
    if (option?.fetch) {
      query.fetchWhenSave = 'true';
    }
    const res = await this.app._requestToUluru({
      method: 'POST',
      path: this._path,
      body: data,
      query,
    });

    const _data = res.body as IObjectData;
    return ObjectDecoder.decode(_data, this.className).setApp(this.app);
  }
}

export class UserClass extends Class {
  private _currentUser: IUser;

  constructor(app: App) {
    super(app, '_User');
  }

  protected get _path(): string {
    return '/1.1/users';
  }

  current(): IUser {
    if (!this._currentUser) {
      const userStr = this.app._kvGet(KEY_CURRENT_USER);
      if (userStr) {
        const user = ObjectDecoder.decode(JSON.parse(userStr));
        this._currentUser = user.setApp(this.app);
      }
    }
    return this._currentUser;
  }

  async logIn(username: string, password: string): Promise<IUser> {
    const res = await this.app._requestToUluru({
      method: 'POST',
      path: '/1.1/login',
      body: { username, password },
    });

    const data = res.body as IUserData;
    const user = ObjectDecoder.decode(data, this.className).setApp(this.app);

    this._currentUser = user;
    const userStr = JSON.stringify(ObjectEncoder.encode(user));
    this.app._kvSet(KEY_CURRENT_USER, userStr);
    this.app.setSessionToken(user.data.sessionToken as string);

    return user;
  }
}
