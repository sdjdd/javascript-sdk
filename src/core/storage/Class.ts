import { LCObject, User } from './Object';
import { Query } from './Query';
import { App, KEY_CURRENT_USER } from '../App';
import {
  IObjectData,
  IClass,
  IObjectAddOption,
  IObject,
  IUser,
  IUserData,
  IUserLoginWithAuthDataOption,
  IUserLoginWithAuthDataAndUnionIdOption,
  IAuthDataWithCaptchaToken,
  IAuthOption,
  IUserClass,
} from '../types';
import { ObjectDecoder, ObjectEncoder } from './encoding';
import { HTTPRequest } from '../http';
import { removeReservedKeys } from '../utils';
import { v4 as uuid } from 'uuid';

export class Class extends Query implements IClass {
  app: App;

  protected get _path(): string {
    return '/1.1/classes/' + this.className;
  }

  object(id: string): IObject {
    return new LCObject(this.className, id, this.app);
  }

  async add(data: IObjectData, option?: IObjectAddOption): Promise<IObject> {
    removeReservedKeys(data);
    const query: HTTPRequest['query'] = {};
    if (option?.fetch) {
      query.fetchWhenSave = 'true';
    }
    const res = await this.app._requestToUluru({
      method: 'POST',
      path: this._path,
      body: ObjectEncoder.encodeData(data),
      query,
    });

    const _data = res.body as IObjectData;
    return ObjectDecoder.decode(_data, this.className).setApp(this.app);
  }
}

export class UserClass extends Class implements IUserClass {
  private _currentUser: IUser;

  constructor(app: App) {
    super(app, '_User');
  }

  static current(app: App): IUser {
    const userStr = app._kvGet(KEY_CURRENT_USER);
    if (userStr) {
      const user = ObjectDecoder.decode(JSON.parse(userStr)) as User;
      user.setApp(app);
      return user;
    }
    return null;
  }

  protected get _path(): string {
    return '/1.1/users';
  }

  object(id: string): IUser {
    return new User(id, this.app);
  }

  private _setCurrent(user: IUser): void {
    this._currentUser = user;
    const userStr = JSON.stringify(ObjectEncoder.encode(user));
    this.app._kvSet(KEY_CURRENT_USER, userStr);
    this.app.setSessionToken(user.data.sessionToken as string);
  }

  current(): IUser {
    if (!this._currentUser) {
      this._currentUser = UserClass.current(this.app);
    }
    return this._currentUser;
  }

  async become(sessionToken: string): Promise<IUser> {
    const res = await this.app._requestToUluru(
      {
        method: 'GET',
        path: this._path + '/me',
      },
      { sessionToken }
    );

    const data = res.body as IObjectData;
    const user = ObjectDecoder.decode(data, this.className) as User;
    user.setApp(this.app);
    this._setCurrent(user);

    return user;
  }

  async signUp(data: IUserData, option?: IObjectAddOption): Promise<IUser> {
    const user = (await this.add(data, option)) as IUser;
    this._setCurrent(user);
    return user;
  }

  async signUpOrLogInWithMobilePhone(
    mobilePhoneNumber: string,
    smsCode: string,
    data: Record<string, unknown>,
    option?: IAuthOption // TODO
  ): Promise<IUser> {
    data = Object.assign({}, data, { mobilePhoneNumber, smsCode });
    return this.signUp(data);
  }

  private async _logInWithData(data: IUserData): Promise<IUser> {
    const res = await this.app._requestToUluru({
      method: 'POST',
      path: '/1.1/login',
      body: data,
    });

    const _data = res.body as IUserData;
    const user = ObjectDecoder.decode(_data, this.className) as User;
    user.setApp(this.app);
    this._setCurrent(user);

    return user;
  }

  logIn(username: string, password: string): Promise<IUser> {
    return this._logInWithData({ username, password });
  }

  logInAnonymously(): Promise<IUser> {
    return this.logInWithAuthData('anonymous', { id: uuid() });
  }

  logInWithEmail(email: string, password: string): Promise<IUser> {
    return this._logInWithData({ email, password });
  }

  logInWithMobilePhone(
    mobilePhoneNumber: string,
    password: string
  ): Promise<IUser> {
    return this._logInWithData({ mobilePhoneNumber, password });
  }

  logInWithMobilePhoneSmsCode(
    mobilePhoneNumber: string,
    smsCode: string
  ): Promise<IUser> {
    return this._logInWithData({ mobilePhoneNumber, smsCode });
  }

  async logInWithAuthData(
    platform: string,
    authData: Record<string, unknown>,
    option?: IUserLoginWithAuthDataOption
  ): Promise<IUser> {
    const query: HTTPRequest['query'] = {};
    if (option?.failOnNotExist) {
      query.failOnNotExist = 'true';
    }
    const res = await this.app._requestToUluru({
      method: 'POST',
      path: this._path,
      query,
      body: { authData: { [platform]: authData } },
    });

    const data = res.body as IObjectData;
    const user = ObjectDecoder.decode(data, this.className) as User;
    user.setApp(this.app);
    this._setCurrent(user);

    return user;
  }

  logInWithAuthDataAndUnionId(
    platform: string,
    authData: Record<string, unknown>,
    unionId: string,
    option: IUserLoginWithAuthDataAndUnionIdOption
  ): Promise<IUser> {
    authData = Object.assign({}, authData, {
      platform: option?.unionIdPlatform ?? 'weixin',
      main_account: option?.asMainAccount ?? false,
      unionid: unionId,
    });
    return this.logInWithAuthData(platform, authData, option);
  }

  logOut(): void {
    this._currentUser = null;
    this.app.setSessionToken(null);
    this.app._kvRemove(KEY_CURRENT_USER);
  }

  async requestEmailVerify(email: string): Promise<void> {
    await this.app._requestToUluru({
      method: 'POST',
      path: '/1.1/requestEmailVerify',
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
    await this.app._requestToUluru(
      {
        method: 'POST',
        path: '/1.1/requestLoginSmsCode',
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
    await this.app._requestToUluru(
      {
        method: 'POST',
        path: '/1.1/requestMobilePhoneVerify',
        body,
      },
      option
    );
  }

  async requestPasswordReset(email: string): Promise<void> {
    await this.app._requestToUluru({
      method: 'POST',
      path: '/1.1/requestPasswordReset',
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
    await this.app._requestToUluru(
      {
        method: 'POST',
        path: '/1.1/requestPasswordResetBySmsCode',
        body,
      },
      option
    );
  }

  async resetPasswordBySmsCode(code: string, password: string): Promise<void> {
    await this.app._requestToUluru({
      method: 'PUT',
      path: '/1.1/resetPasswordBySmsCode/' + code,
      body: { password },
    });
  }

  async verifyMobilePhone(code: string): Promise<void> {
    await this.app._requestToUluru({
      method: 'POST',
      path: '/1.1/resetPasswordBySmsCode/' + code,
    });
  }
}
