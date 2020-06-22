import { ClassReference } from '../storage/ClassReference';
import { ObjectReference } from '../storage';
import { API } from '../app/API';

export type UserLoginOptions =
  | {
      username: string;
      password: string;
    }
  | {
      email: string;
      password: string;
    }
  | {
      mobilePhoneNumber: string;
      password: string;
    }
  | {
      mobilePhoneNumber: string;
      smsCode: string;
    };

export class UserClassReference extends ClassReference {
  constructor(api: API) {
    super('_User', api);
  }

  add(): never {
    throw new Error('please use signUp');
  }

  // signUp(data: {
  //   username: string;
  //   password: string;
  //   email?: string;
  //   mobilePhoneNumber?: string;
  //   [key: string]: unknown;
  // }): Promise<ObjectReference> {
  //   return this.add(data);
  // }
}
