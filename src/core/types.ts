export interface IAppInfo {
  appId: string;
  appKey: string;
  serverURL: string;
  masterKey?: string;
}

export interface IAuthOption {
  sessionToken?: string;
  useMasterKey?: boolean;
}

export interface IQuery {
  select(...columns: string[]): IQuery;
  except(...columns: string[]): IQuery;
  where(key: string, condition: string, value?: unknown): IQuery;
  or(): IQuery;
  limit(count: number): IQuery;
  skip(count: number): IQuery;
  orderBy(key: string, rule: 'asc' | 'desc'): IQuery;
  find(): Promise<IObject[]>;
  first(): Promise<IObject>;
  count(): Promise<number>;
}

export interface IClass {
  object(id: string): IObject;
  add(data: IObjectData, option?: IObjectAddOption): Promise<IObject>;
}

export interface IObjectAddOption extends IAuthOption {
  include?: string[];
  includeACL?: boolean; // returnACL
  fetch?: boolean;
}

export interface IObjectData {
  className?: string; // pointer only
  objectId?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  [key: string]: unknown;
}

export interface IObjectUpdateOption extends IObjectAddOption {
  where?: IQuery;
}

export interface IObjectGetOption {
  include?: string[];
}

export type ACLAction = 'read' | 'write';

export interface IACL {
  allow(subject: '*' | string, action: ACLAction): this;
  deny(subject: '*' | string, action: ACLAction): this;
  can(subject: '*' | string, action: ACLAction): boolean;
}

export interface IObject {
  className: string;
  objectId: string;
  data?: IObjectData;
  get(option?: IObjectGetOption): Promise<IObject>;
  update(data: IObjectData, option?: IObjectUpdateOption): Promise<IObject>;
  delete(option?: IAuthOption): Promise<void>;
}

export interface IDate {
  __type: 'Date';
  iso: string;
}

export interface IPointer {
  __type: 'Pointer';
  className: string;
  objectId: string;
  [key: string]: unknown;
}

export interface IGeoPoint {
  __type: 'GeoPoint';
  latitude: number;
  longitude: number;
}

export interface IUserClass extends IClass {
  object(id: string): IUser;
  current(): IUser;
  become(sessionToken: string): Promise<IUser>;
  signUp(data: IUserData, option?: IObjectAddOption): Promise<IUser>;
  signUpOrLogInWithMobilePhone(
    mobilePhoneNumber: string,
    smsCode: string,
    data: Record<string, unknown>,
    option?: IAuthOption
  ): Promise<IUser>;
  logIn(username: string, password: string): Promise<IUser>;
  logInAnonymously(): Promise<IUser>;
  logInWithEmail(email: string, password: string): Promise<IUser>;
  logInWithMobilePhone(
    mobilePhoneNumber: string,
    password: string
  ): Promise<IUser>;
  logInWithMobilePhoneSmsCode(
    mobilePhoneNumber: string,
    smsCode: string
  ): Promise<IUser>;
  logInWithAuthData(
    platform: string,
    authData: Record<string, unknown>,
    option?: IUserLoginWithAuthDataOption
  ): Promise<IUser>;
  logOut(): void;
  requestLoginSmsCode(
    mobilePhoneNumber: string,
    option?: IAuthDataWithCaptchaToken
  ): Promise<void>;
  requestEmailVerify(email: string): Promise<void>;
  requestMobilePhoneVerify(
    mobilePhoneNumber: string,
    option?: IAuthDataWithCaptchaToken
  ): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  requestPasswordResetBySmsCode(
    mobilePhoneNumber: string,
    option?: IAuthDataWithCaptchaToken
  ): Promise<void>;
  resetPasswordBySmsCode(code: string, password: string): Promise<void>;
  verifyMobilePhone(code: string): Promise<void>;
}

export interface IUserData extends IObjectData {
  username?: string;
  password?: string;
  email?: string;
  emailVerified?: boolean;
  mobilePhoneNumber?: string;
  mobilePhoneVerified?: boolean;
  sessionToken?: string;
}

export interface IUser extends IObject {
  sessionToken?: string;
  isAnonymous(): boolean;
  isAuthenticated(): Promise<boolean>;
  updatePassword(
    oldPassword: string,
    newPassword: string,
    option?: IAuthOption
  ): Promise<void>;
}

export interface IUserLoginWithAuthDataOption {
  failOnNotExist?: boolean;
}

export interface IUserLoginWithAuthDataAndUnionIdOption
  extends IUserLoginWithAuthDataOption {
  unionIdPlatform?: string;
  asMainAccount?: boolean;
}

export interface IAuthDataWithCaptchaToken extends IAuthOption {
  validateToken?: string;
}
