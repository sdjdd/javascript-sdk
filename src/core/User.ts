import { ObjectReference } from './ObjectReference';
import { API } from './API';

export class Role extends ObjectReference {}

export class User extends ObjectReference {
  sessionToken: string;

  constructor(api: API, objectId: string) {
    super(api, '_User', objectId);
  }
}
