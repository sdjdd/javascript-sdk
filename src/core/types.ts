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

export interface IClassAddOption {
  fetch?: boolean;
}

export interface IClass {
  object(id: string): IObject;
  add(data: IObjectData, option?: IClassAddOption): Promise<IObject>;
}

export interface IObjectData {
  className?: string; // pointer only
  objectId?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  [key: string]: unknown;
}

export interface IObjectUpdateOption extends IAuthOption {
  keys?: string[];
  include?: string[];
  includeACL?: boolean; // returnACL
}

export interface IObjectGetOption {
  include?: string[];
}

export interface IACL {
  allow(subject: '*' | string, action: 'read' | 'write'): this;
  deny(subject: '*' | string, action: 'read' | 'write'): this;
  can(subject: '*' | string, action: 'read' | 'write'): boolean;
}

export interface IObject {
  className: string;
  objectId: string;
  data?: IObjectData;
  update(data: IObjectData, option?: IObjectUpdateOption): Promise<IObject>;
  delete(option?: IAuthOption): Promise<void>;
  get(option?: IObjectGetOption): Promise<IObject>;
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
