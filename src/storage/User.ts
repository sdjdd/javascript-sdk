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
  IApp,
} from '../types';
import { KEY_CURRENT_USER, KEY_SESSION_TOKEN } from '../Cache';
import { Class } from './Class';
import { ObjectUtils, assert } from '../utils';
import { UluruError } from '../errors';
import { ObjectEncoder, ObjectDecoder } from './ObjectEncoding';
import { APIPath } from '../APIPath';
import { Cache } from '../Cache';
import { Adapters } from '../Adapters';
import { send } from '../http';
import { PATH_ME } from '../api-path';

export class UserClass extends Class {
  constructor(app: IApp) {
    super(app, '_User');
  }

  static _setCurrentUser(app: IApp, user: User): void {
    Adapters.kvSet(
      KEY_CURRENT_USER,
      JSON.stringify(ObjectEncoder.encode(user)),
      app.appId
    );
    Cache.set(app, KEY_CURRENT_USER, user);
    Cache.set(app, KEY_SESSION_TOKEN, user.sessionToken, true);
  }

  static _getCurrentUser(app: IApp): IUser {
    let user = Cache.get(app, KEY_CURRENT_USER) as IUser;
    if (!user) {
      const userStr = Adapters.kvGet(KEY_CURRENT_USER, app.appId);
      if (userStr) {
        user = ObjectDecoder.decode(JSON.parse(userStr)).setApp(app);
        Cache.set(app, KEY_CURRENT_USER, user);
      }
    }
    return user || null;
  }

  static logOut(app: IApp): void {
    Cache.delete(app, KEY_SESSION_TOKEN);
    Cache.delete(app, KEY_CURRENT_USER);
    Adapters.kvRemove(KEY_CURRENT_USER, app.appId);
  }

  object(id: string): User {
    return new User(id, this.app);
  }

  current(): IUser {
    return UserClass._getCurrentUser(this.app);
  }

  async become(sessionToken: string): Promise<User> {
    const res = await send({ path: PATH_ME }).to(this.app, { sessionToken });
    const data = res.body as IObjectDataRaw;
    const user = ObjectDecoder.decode(data, this.className) as User;
    user.setApp(this.app);
    UserClass._setCurrentUser(this.app, user);
    return user;
  }

  async signUp(data: IUserData, option?: IAuthOption): Promise<User> {
    assert(data.username, 'The username must be provided');
    assert(data.password, 'The password must be provided');
    const res = await send(
      {
        method: 'POST',
        path: APIPath.class(this.className),
        body: data,
      },
      option
    ).to(this.app, option);
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
    const res = await send({
      method: 'POST',
      path: APIPath.login,
      body: data,
    }).to(this.app);
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
    const res = await send({
      method: 'POST',
      path: APIPath.class(this.className),
      body: {
        authData: { [platform]: authData },
      },
      query: {
        failOnNotExist: option?.failOnNotExist ? 'true' : undefined,
      },
    }).to(this.app);
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
    send({
      method: 'POST',
      path: APIPath.requestEmailVerify,
      body: { email },
    }).to(this.app);
  }

  async requestLoginSmsCode(
    mobilePhoneNumber: string,
    option?: IAuthDataWithCaptchaToken
  ): Promise<void> {
    const body: Record<string, string> = { mobilePhoneNumber };
    if (option?.validateToken) {
      body.validate_token = option.validateToken;
    }
    await send(
      {
        method: 'POST',
        path: APIPath.requestLoginSmsCode,
        body,
      },
      option
    ).to(this.app, option);
  }

  async requestMobilePhoneVerify(
    mobilePhoneNumber: string,
    option?: IAuthDataWithCaptchaToken
  ): Promise<void> {
    const body: Record<string, string> = { mobilePhoneNumber };
    if (option?.validateToken) {
      body.validate_token = option.validateToken;
    }
    await send(
      {
        method: 'POST',
        path: APIPath.requestMobilePhoneVerify,
        body,
      },
      option
    ).to(this.app, option);
  }

  async requestPasswordReset(email: string): Promise<void> {
    await send({
      method: 'POST',
      path: APIPath.requestPasswordReset,
      body: { email },
    }).to(this.app);
  }

  async requestPasswordResetBySmsCode(
    mobilePhoneNumber: string,
    option?: IAuthDataWithCaptchaToken
  ): Promise<void> {
    const body: Record<string, string> = { mobilePhoneNumber };
    if (option?.validateToken) {
      body.validate_token = option.validateToken;
    }
    await send(
      {
        method: 'POST',
        path: APIPath.requestPasswordResetBySmsCode,
        body,
      },
      option
    ).to(this.app, option);
  }

  async resetPasswordBySmsCode(code: string, password: string): Promise<void> {
    await send({
      method: 'PUT',
      path: APIPath.resetPasswordBySmsCode(code),
      body: { password },
    }).to(this.app);
  }

  async verifyMobilePhone(code: string): Promise<void> {
    await send({
      method: 'POST',
      path: APIPath.verifyMobilePhone(code),
    }).to(this.app);
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
    await send(
      {
        method: 'POST',
        path: APIPath.requestChangePhoneNumber,
        body,
      },
      option
    ).to(this.app, option);
  }

  async changePhoneNumber(
    mobilePhoneNumber: string,
    code: string,
    option?: IAuthOption
  ): Promise<void> {
    await send(
      {
        method: 'POST',
        path: APIPath.changePhoneNumber,
        body: { mobilePhoneNumber, code },
      },
      option
    ).to(this.app, option);
  }
}

export class User extends LCObject implements IUser {
  data?: IUserData;

  constructor(objectId: string, app?: IApp) {
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
      await send({ path: PATH_ME }).to(this.app, {
        sessionToken: this.sessionToken,
      });
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

    const res = await send({
      method: 'PUT',
      path: APIPath.updatePassword(this.objectId),
      body: { old_password: oldPassword, new_password: newPassword },
    }).to(this.app, {
      sessionToken: this.sessionToken,
      ...option,
    });

    const data = res.body as IUserData;
    this.data.sessionToken = data.sessionToken;

    if (this.isCurrentUser()) {
      Cache.delete(this.app, KEY_SESSION_TOKEN);
      Cache.delete(this.app, KEY_CURRENT_USER);

      const userKV = JSON.parse(
        Adapters.kvGet(KEY_CURRENT_USER, this.app.appId)
      );
      userKV.sessionToken = this.sessionToken;
      Adapters.kvSet(KEY_CURRENT_USER, JSON.stringify(userKV), this.app.appId);
    }
  }

  async get(option?: IObjectGetOption): Promise<User> {
    const task = new ObjectGetTask(this, option);
    const user = (await task.do()) as User;

    if (user.isCurrentUser()) {
      Cache.delete(this.app, KEY_CURRENT_USER);

      const userKV = JSON.parse(
        Adapters.kvGet(KEY_CURRENT_USER, this.app.appId)
      );
      Object.assign(userKV, task.responseBody);
      Adapters.kvSet(KEY_CURRENT_USER, JSON.stringify(userKV), this.app.appId);
    }
    return user;
  }

  async update(data: IUserData, option?: IObjectUpdateOption): Promise<User> {
    const task = new ObjectUpdateTask(this, data, option);
    const user = (await task.do()) as User;

    if (this.isCurrentUser()) {
      Cache.delete(this.app, KEY_CURRENT_USER);

      const userKV = JSON.parse(
        Adapters.kvGet(KEY_CURRENT_USER, this.app.appId)
      );
      Object.entries(data).forEach(([key, value]) => {
        if (value?.__op === 'Delete') {
          ObjectUtils.deleteKey(userKV, key);
        }
      });
      Object.assign(userKV, task.responseBody);
      Adapters.kvSet(KEY_CURRENT_USER, JSON.stringify(userKV), this.app.appId);
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
