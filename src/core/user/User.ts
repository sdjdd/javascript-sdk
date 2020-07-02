import { ObjectReference, ObjectAttributes } from '../storage/Object';
import { Class } from '../storage/Class';
import { App } from '../app';

export interface UserAttributes extends ObjectAttributes {
  username: string;
  password: string;
  email?: string;
  readonly emailVerified?: boolean;
  mobilePhoneNumber?: string;
  readonly mobilePhoneNumberVerified?: boolean;
}

export class UserClassReference extends Class {
  constructor(app: App) {
    super('_User', app);
  }

  // async add(user: UserAttributes): Promise<User> {
  //   const res = await this.api.userSignUp(user);
  //   return new User(this.api, res.objectId as string);
  // }
}

export class User extends ObjectReference {
  sessionToken: string;

  constructor(app: App, objectId: string) {
    super(app, '_User', objectId);
  }
}
