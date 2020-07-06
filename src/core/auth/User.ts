import { LCObject } from '../storage/Object';
import { Class } from '../storage/Class';
import { App } from '../App';
import { IObjectData, IUser } from '../types';

export interface UserAttributes extends IObjectData {
  username: string;
  password: string;
  email?: string;
  readonly emailVerified?: boolean;
  mobilePhoneNumber?: string;
  readonly mobilePhoneNumberVerified?: boolean;
}

export class UserClassReference extends Class {
  constructor(app: App) {
    super(app, '_User');
  }

  // async add(user: UserAttributes): Promise<User> {
  //   const res = await this.api.userSignUp(user);
  //   return new User(this.api, res.objectId as string);
  // }
}

export class User extends LCObject implements IUser {
  sessionToken: string;

  constructor(app: App, objectId: string) {
    super(app, '_User', objectId);
  }
}
