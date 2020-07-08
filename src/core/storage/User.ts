import { Class } from './Class';
import { IUser, IUserData } from '../types';
import { App } from '../App';
import { PlatformSupport } from '../Platform';
import { LCObject } from './Object';

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

export class User extends LCObject implements IUser {
  sessionToken: string;

  constructor(app: App, objectId: string) {
    super(app, '_User', objectId);
  }
}
