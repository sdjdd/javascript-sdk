import { LCObject, User } from './Object';
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
import { ObjectDecoder } from './encoding';

export class Class extends Query implements IClass {
  app: App;

  object(id: string): LCObject {
    return new LCObject(this.app, this.className, id);
  }

  async add(data: IObjectData, option?: IClassAddOption): Promise<IObject> {
    const req = this.app._makeBaseRequest(
      'POST',
      '/1.1/classes/' + this.className
    );
    req.body = data;
    if (option?.fetch) {
      req.query = { fetchWhenSave: 'true' };
    }

    const platform = PlatformSupport.getPlatform();
    const res = await platform.network.request(req);
    checkUluruResponse(res);

    return ObjectDecoder.decode(res.body as IObjectData, this.app);
  }
}

export class UserClass extends Class {
  currentUser: IUser;

  constructor(app: App) {
    super(app, '_User');
  }

  async logIn(username: string, password: string): Promise<IUser> {
    const req = this.app._makeBaseRequest('POST', '/1.1/login');
    req.body = { username, password };

    const platform = PlatformSupport.getPlatform();
    const res = await platform.network.request(req);

    const data = res.body as IUserData;
    this.currentUser = new User(this.app, data.objectId);
    this.currentUser.data = data;
    this.currentUser.sessionToken = data.sessionToken;
    return this.currentUser;
  }
}
