import { v4 as uuid } from 'uuid';
import { LCObject, User } from './Object';
import { Query } from './Query';
import { App, KEY_CURRENT_USER } from '../App';
import {
  IObjectData,
  IClass,
  IObjectAddOption,
  IUserData,
  IUserLoginWithAuthDataOption,
  IUserLoginWithAuthDataAndUnionIdOption,
  IAuthDataWithCaptchaToken,
  IAuthOption,
  IUserClass,
} from '../types';
import { ObjectDecoder, ObjectEncoder } from './encoding';
import { removeReservedKeys, HTTPRequest, assert } from '../utils';

export class Class extends Query implements IClass {
  app: App;

  object(id: string): LCObject {
    return new LCObject(this.className, id, this.app);
  }

  async add(data: IObjectData, option?: IObjectAddOption): Promise<LCObject> {
    removeReservedKeys(data);
    const req = new HTTPRequest({
      method: 'POST',
      path: '/1.1/classes/' + this.className,
      body: ObjectEncoder.encodeData(data),
    });
    if (option?.fetch) {
      req.query.fetchWhenSave = 'true';
    }
    const res = await this.app._uluru(req);

    const _data = res.body as IObjectData;
    return ObjectDecoder.decode(_data, this.className).setApp(this.app);
  }
}

export class UserClass extends Class implements IUserClass {
  constructor(app: App) {
    super(app, '_User');
  }

  static _setCurrentUser(app: App, user: User): void {
    user.setApp(app);
    const userStr = JSON.stringify(ObjectEncoder.encode(user));
    app._kvSet(KEY_CURRENT_USER, userStr);
    app.setSessionToken(user.sessionToken);
  }

  static _getCurrentUser(app: App): User {
    const userStr = app._kvGet(KEY_CURRENT_USER);
    if (userStr) {
      const user = ObjectDecoder.decode(JSON.parse(userStr)) as User;
      user.setApp(app);
      return user;
    }
    return null;
  }

  object(id: string): User {
    return new User(id, this.app);
  }

  _setCurrent(user: User): void {
    UserClass._setCurrentUser(this.app, user);
  }

  current(): User {
    return UserClass._getCurrentUser(this.app);
  }

  async become(sessionToken: string): Promise<User> {
    const res = await this.app._uluru(
      new HTTPRequest({ path: '/1.1/users/me' }),
      { sessionToken }
    );

    const data = res.body as IObjectData;
    const user = ObjectDecoder.decode(data, this.className) as User;
    user.setApp(this.app);
    this._setCurrent(user);
    return user;
  }

  async signUp(data: IUserData, option?: IAuthOption): Promise<User> {
    assert(data.username, 'The username must be provided');
    assert(data.password, 'The password must be provided');
    const res = await this.app._uluru(
      new HTTPRequest({
        method: 'POST',
        path: '/1.1/users',
        body: data,
      }),
      option
    );
    const _data = res.body as IUserData;
    const user = ObjectDecoder.decode(_data, this.className) as User;
    this._setCurrent(user);
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
    const res = await this.app._uluru(
      new HTTPRequest({
        method: 'POST',
        path: '/1.1/login',
        body: data,
      })
    );
    const _data = res.body as IUserData;
    const user = ObjectDecoder.decode(_data, this.className) as User;
    this._setCurrent(user);
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
    const req = new HTTPRequest({
      method: 'POST',
      path: '/1.1/users',
      body: { authData: { [platform]: authData } },
    });
    if (option?.failOnNotExist) {
      req.query.failOnNotExist = 'true';
    }
    const res = await this.app._uluru(req);

    const data = res.body as IObjectData;
    const user = ObjectDecoder.decode(data, this.className) as User;
    this._setCurrent(user);
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
    this.app.setSessionToken(null);
    this.app._kvRemove(KEY_CURRENT_USER);
  }

  async requestEmailVerify(email: string): Promise<void> {
    await this.app._uluru(
      new HTTPRequest({
        method: 'POST',
        path: '/1.1/requestEmailVerify',
        body: { email },
      })
    );
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
      new HTTPRequest({
        method: 'POST',
        path: '/1.1/requestLoginSmsCode',
        body,
      }),
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
      new HTTPRequest({
        method: 'POST',
        path: '/1.1/requestMobilePhoneVerify',
        body,
      }),
      option
    );
  }

  async requestPasswordReset(email: string): Promise<void> {
    await this.app._uluru(
      new HTTPRequest({
        method: 'POST',
        path: '/1.1/requestPasswordReset',
        body: { email },
      })
    );
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
      new HTTPRequest({
        method: 'POST',
        path: '/1.1/requestPasswordResetBySmsCode',
        body,
      }),
      option
    );
  }

  async resetPasswordBySmsCode(code: string, password: string): Promise<void> {
    await this.app._uluru(
      new HTTPRequest({
        method: 'PUT',
        path: '/1.1/resetPasswordBySmsCode/' + code,
        body: { password },
      })
    );
  }

  async verifyMobilePhone(code: string): Promise<void> {
    await this.app._uluru(
      new HTTPRequest({
        method: 'POST',
        path: '/1.1/verifyMobilePhone/' + code,
      })
    );
  }
}
