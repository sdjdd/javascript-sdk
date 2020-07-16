import {
  IHTTPResponse,
  IRequestOption as IAdapterRequestOption,
} from '../adapters';

export interface IAppInfo {
  appId: string;
  appKey: string;
  serverURL: string;
  masterKey?: string;
}

export interface IAuthOption extends IAdapterRequestOption {
  sessionToken?: string;
  useMasterKey?: boolean;
}

export interface IQueryFindOption {
  include?: string[];
}

export interface IQuery {
  _parseWhere(): unknown;
}

export interface IObjectAddOption extends IAuthOption {
  include?: string[];
  includeACL?: boolean; // returnACL
  fetch?: boolean;
}

export interface IObjectData extends Record<string, unknown> {
  className?: string; // pointer only
  objectId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  ACL?: IACL;
}

export interface IObjectDataRaw extends Record<string, unknown> {
  className?: string; // pointer only
  objectId?: string;
  createdAt?: string;
  updatedAt?: string;
  ACL?: Record<string, IACLPrivilege>;
}

export interface IObjectUpdateOption extends IObjectAddOption {
  where?: IQuery;
}

export interface IObjectGetOption {
  include?: string[];
}

export type ACLSubject = '*' | string | IUser;
export type ACLAction = 'read' | 'write';

export interface IACLPrivilege {
  read?: boolean;
  write?: boolean;
}

export interface IACL {
  allow(subject: '*' | string, action: ACLAction): this;
  deny(subject: '*' | string, action: ACLAction): this;
  can(subject: '*' | string, action: ACLAction): boolean;
  toJSON(): Record<string, IACLPrivilege>;
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

export interface IPointer extends Record<string, unknown> {
  __type: 'Pointer';
  className: string;
  objectId: string;
}

export interface IGeoPoint {
  __type: 'GeoPoint';
  latitude: number;
  longitude: number;
}

export interface IFileTokens extends IObjectDataRaw {
  token: string;
  url: string;
  mime_type: string;
  provider: string;
  upload_url: string;
  bucket: string;
  key: string;
}

export interface IFile {
  __type: 'File';
  ACL?: IACL;
  key: string;
  name: string;
  data: ArrayBuffer;
  mime?: string;
  metaData?: Record<string, unknown>;
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

export interface IOperation extends Record<string, unknown> {
  __op: string;
}

export interface IUploadFileInfo {
  url: string;
  key: string;
  token: string;
}

export interface IUploadOption extends IAdapterRequestOption, IAuthOption {
  keepFileName?: boolean;
  header?: Record<string, string>; // send to file provider
}

export interface IFileProvider {
  upload(
    file: IFile,
    info: IUploadFileInfo,
    option?: IUploadOption
  ): Promise<IHTTPResponse>;
}
