import { v4 as uuid } from 'uuid';
import { LCObject, ObjectGetTask, ObjectUpdateTask } from './Object';
import {
  IUser,
  IUserData,
  IAuthOption,
  IObjectGetOption,
  IObjectDataRaw,
  IObjectUpdateOption,
  IUserLoginWithAuthDataOption,
  IUserLoginWithAuthDataAndUnionIdOption,
  IAuthDataWithCaptchaToken,
} from '../types';
import { App, KEY_CURRENT_USER } from '../App';
import { Class } from './Class';
import { ObjectUtils, assert } from '../utils';
import { UluruError } from '../errors';
import { ObjectEncoder, ObjectDecoder } from './ObjectEncoding';
import { APIPath } from '../APIPath';

export class UserClass extends Class {
  constructor(app: App) {
    super(app, '_User');
  }

  static _setCurrentUser(app: App, user: User): void {
    app._kvSet(KEY_CURRENT_USER, JSON.stringify(ObjectEncoder.encode(user)));
    app._cacheSet(KEY_CURRENT_USER, user);
    app.setSessionToken(user.sessionToken);
  }

  static _getCurrentUser(app: App): IUser {
    let user = app._cacheGet(KEY_CURRENT_USER) as IUser;
    if (!user) {
      const userStr = app._kvGet(KEY_CURRENT_USER);
      if (userStr) {
        user = ObjectDecoder.decode(JSON.parse(userStr)).setApp(app);
        app._cacheSet(KEY_CURRENT_USER, user);
      }
    }
    return user || null;
  }

  static logOut(app: App): void {
    app.setSessionToken(null);
    app._cacheRemove(KEY_CURRENT_USER);
    app._kvRemove(KEY_CURRENT_USER);
  }

  object(id: string): User {
    return new User(id, this.app);
  }

  current(): IUser {
    return UserClass._getCurrentUser(this.app);
  }

  async become(sessionToken: string): Promise<User> {
    const res = await this.app._uluru({ path: APIPath.me }, { sessionToken });
    const data = res.body as IObjectDataRaw;
    const user = ObjectDecoder.decode(data, this.className) as User;
    user.setApp(this.app);
    UserClass._setCurrentUser(this.app, user);
    return user;
  }

  async signUp(data: IUserData, option?: IAuthOption): Promise<User> {
    assert(data.username, 'The username must be provided');
    assert(data.password, 'The password must be provided');
    const res = await this.app._uluru(
      {
        method: 'POST',
        path: APIPath.class(this.className),
        body: data,
      },
      option
    );
    const _data = res.body as IObjectDataRaw;
    const user = ObjectDecoder.decode(_data, this.className) as User;
    user.setApp(this.app);
    UserClass._setCurrentUser(this.app, user);
    return user;
  }

  async signUpOrLogInWithMobilePhone(
    mobilePhoneNumber: string,
    smsCode: string,
    data?: Record<string, unknown>,
    option?: IAuthOption
  ): Promise<User> {
    data = Object.assign({}, data, { mobilePhoneNumber, smsCode });
    return this.signUp(data, option);
  }

  private async _logInWithData(data: IUserData): Promise<User> {
    const res = await this.app._uluru({
      method: 'POST',
      path: APIPath.login,
      body: data,
    });
    const _data = res.body as IObjectDataRaw;
    const user = ObjectDecoder.decode(_data, this.className) as User;
    user.setApp(this.app);
    UserClass._setCurrentUser(this.app, user);
    return user;
  }

  logIn(username: string, password: string): Promise<User> {
    return this._logInWithData({ username, password });
  }

  logInAnonymously(): Promise<User> {
    return this.logInWithAuthData('anonymous', { id: uuid() });
  }

  logInWithEmail(email: string, password: string): Promise<User> {
    return this._logInWithData({ email, password });
  }

  logInWithMobilePhone(
    mobilePhoneNumber: string,
    password: string
  ): Promise<User> {
    return this._logInWithData({ mobilePhoneNumber, password });
  }

  logInWithMobilePhoneSmsCode(
    mobilePhoneNumber: string,
    smsCode: string
  ): Promise<User> {
    return this._logInWithData({ mobilePhoneNumber, smsCode });
  }

  async logInWithAuthData(
    platform: string,
    authData: Record<string, unknown>,
    option?: IUserLoginWithAuthDataOption
  ): Promise<User> {
    const res = await this.app._uluru({
      method: 'POST',
      path: APIPath.class(this.className),
      body: {
        authData: { [platform]: authData },
      },
      query: {
        failOnNotExist: option?.failOnNotExist ? 'true' : undefined,
      },
    });
    const data = res.body as IObjectDataRaw;
    const user = ObjectDecoder.decode(data, this.className) as User;
    user.setApp(this.app);
    UserClass._setCurrentUser(this.app, user);
    return user;
  }

  // TODO: remove this function
  logInWithAuthDataAndUnionId(
    platform: string,
    authData: Record<string, unknown>,
    unionId: string,
    option: IUserLoginWithAuthDataAndUnionIdOption
  ): Promise<User> {
    authData = Object.assign({}, authData, {
      platform: option?.unionIdPlatform ?? 'weixin',
      main_account: option?.asMainAccount ?? false,
      unionid: unionId,
    });
    return this.logInWithAuthData(platform, authData, option);
  }

  logOut(): void {
    UserClass.logOut(this.app);
  }

  async requestEmailVerify(email: string): Promise<void> {
    await this.app._uluru({
      method: 'POST',
      path: APIPath.requestEmailVerify,
      body: { email },
    });
  }

  async requestLoginSmsCode(
    mobilePhoneNumber: string,
    option?: IAuthDataWithCaptchaToken
  ): Promise<void> {
    const body: Record<string, string> = { mobilePhoneNumber };
    if (option?.validateToken) {
      body.validate_token = option.validateToken;
    }
    await this.app._uluru(
      {
        method: 'POST',
        path: APIPath.requestLoginSmsCode,
        body,
      },
      option
    );
  }

  async requestMobilePhoneVerify(
    mobilePhoneNumber: string,
    option?: IAuthDataWithCaptchaToken
  ): Promise<void> {
    const body: Record<string, string> = { mobilePhoneNumber };
    if (option?.validateToken) {
      body.validate_token = option.validateToken;
    }
    await this.app._uluru(
      {
        method: 'POST',
        path: APIPath.requestMobilePhoneVerify,
        body,
      },
      option
    );
  }

  async requestPasswordReset(email: string): Promise<void> {
    await this.app._uluru({
      method: 'POST',
      path: APIPath.requestPasswordReset,
      body: { email },
    });
  }

  async requestPasswordResetBySmsCode(
    mobilePhoneNumber: string,
    option?: IAuthDataWithCaptchaToken
  ): Promise<void> {
    const body: Record<string, string> = { mobilePhoneNumber };
    if (option?.validateToken) {
      body.validate_token = option.validateToken;
    }
    await this.app._uluru(
      {
        method: 'POST',
        path: APIPath.requestPasswordResetBySmsCode,
        body,
      },
      option
    );
  }

  async resetPasswordBySmsCode(code: string, password: string): Promise<void> {
    await this.app._uluru({
      method: 'PUT',
      path: APIPath.resetPasswordBySmsCode(code),
      body: { password },
    });
  }

  async verifyMobilePhone(code: string): Promise<void> {
    await this.app._uluru({
      method: 'POST',
      path: APIPath.verifyMobilePhone(code),
    });
  }

  async requestChangePhoneNumber(
    mobilePhoneNumber: string,
    ttl?: number,
    option?: IAuthDataWithCaptchaToken
  ): Promise<void> {
    const body: Record<string, unknown> = { mobilePhoneNumber };
    if (ttl) {
      body.ttl = ttl;
    }
    await this.app._uluru(
      {
        method: 'POST',
        path: APIPath.requestChangePhoneNumber,
        body,
      },
      option
    );
  }

  async changePhoneNumber(
    mobilePhoneNumber: string,
    code: string,
    option?: IAuthOption
  ): Promise<void> {
    await this.app._uluru(
      {
        method: 'POST',
        path: APIPath.changePhoneNumber,
        body: { mobilePhoneNumber, code },
      },
      option
    );
  }
}

export class User extends LCObject implements IUser {
  data?: IUserData;

  constructor(objectId: string, app?: App) {
    super('_User', objectId, app);
  }

  get sessionToken(): string {
    return this.data?.sessionToken as string;
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
      await this.app._uluru(
        { path: APIPath.me },
        { sessionToken: this.sessionToken }
      );
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
      throw new Error('The user is not logged in');
    }

    const res = await this.app._uluru(
      {
        method: 'PUT',
        path: APIPath.updatePassword(this.objectId),
        body: { old_password: oldPassword, new_password: newPassword },
      },
      {
        sessionToken: this.sessionToken,
        ...option,
      }
    );

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
    const task = new ObjectGetTask(this, option);
    const user = (await task.do()) as User;

    if (user.isCurrentUser()) {
      this.app._cacheRemove(KEY_CURRENT_USER);

      const userKV = JSON.parse(this.app._kvGet(KEY_CURRENT_USER));
      Object.assign(userKV, task.responseBody);
      this.app._kvSet(KEY_CURRENT_USER, JSON.stringify(userKV));
    }
    return user;
  }

  async update(data: IUserData, option?: IObjectUpdateOption): Promise<User> {
    const task = new ObjectUpdateTask(this, data, option);
    const user = (await task.do()) as User;

    if (this.isCurrentUser()) {
      this.app._cacheRemove(KEY_CURRENT_USER);

      const userKV = JSON.parse(this.app._kvGet(KEY_CURRENT_USER));
      Object.entries(data).forEach(([key, value]) => {
        if (value?.__op === 'Delete') {
          ObjectUtils.deleteKey(userKV, key);
        }
      });
      Object.assign(userKV, task.responseBody);
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
