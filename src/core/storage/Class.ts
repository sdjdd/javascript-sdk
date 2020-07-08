import { LCObject } from './Object';
import { Query } from './Query';
import { App } from '../App';
import { PlatformSupport } from '../Platform';
import { checkUluruResponse } from '../utils';
import {
  IObjectData,
  IClass,
  IClassAddOption,
  IObject,
  IUser,
  IUserData,
} from '../types';
import { ObjectDecoder, ObjectEncoder } from './encoding';

export class Class extends Query implements IClass {
  app: App;

  protected get _path(): string {
    return '/1.1/classes/' + this.className;
  }

  object(id: string): LCObject {
    return new LCObject(this.className, id, this.app);
  }

  async add(data: IObjectData, option?: IClassAddOption): Promise<IObject> {
    const req = this.app._makeBaseRequest('POST', this._path);
    req.body = data;
    if (option?.fetch) {
      req.query.fetchWhenSave = 'true';
    }

    const platform = PlatformSupport.getPlatform();
    const res = await platform.network.request(req);
    checkUluruResponse(res);

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
      const str = this.app._get('currentUser');
      if (str) {
        this._currentUser = ObjectDecoder.decode(JSON.parse(str)).setApp(
          this.app
        );
      }
    }
    return this._currentUser;
  }

  async logIn(username: string, password: string): Promise<IUser> {
    const req = this.app._makeBaseRequest('POST', '/1.1/login');
    req.body = { username, password };

    const platform = PlatformSupport.getPlatform();
    const res = await platform.network.request(req);

    const data = res.body as IUserData;
    const user = ObjectDecoder.decode(data, this.className).setApp(this.app);

    this._currentUser = user;
    this.app._set('currentUser', JSON.stringify(ObjectEncoder.encode(user)));
    this.app.sessionToken = user.data.sessionToken as string;

    return user;
  }
}
