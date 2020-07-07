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

export interface IObjectUpdateOption {
  include?: string[];
}

export interface IObjectGetOption {
  include?: string[];
}

export interface IObject {
  className: string;
  objectId: string;
  data?: IObjectData;
  update(data: IObjectData, option?: IObjectUpdateOption): Promise<IObject>;
  delete(): Promise<void>;
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
