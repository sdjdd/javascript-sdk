import { IUserData, IUser } from '../types';
import { App } from '../App';
import { PlatformSupport } from '../Platform';
import { User } from './User';
import { defaultApp } from '../global';

export class Auth {
  app: App;
  currentUser: User;

  constructor(app: App) {
    this.app = app;
  }

  async add(data: IUserData): Promise<IUser> {
    const req = this.app._makeBaseRequest('POST', '/1.1/users');
    req.body = data;
    const platform = PlatformSupport.getPlatform();
    const res = await platform.network.request(req);

    const attr = res.body as IUserData;
    const user = new User(this.app, attr.objectId);
    user.data = attr;
    return user;
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

export const auth = new Auth(defaultApp);
